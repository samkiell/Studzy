import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
env.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) envVars[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

async function listFolder(bucket, path = '') {
  let files = [];
  const { data, error } = await supabase.storage.from(bucket).list(path, { limit: 1000 });
  if (error || !data) return files;

  for (const item of data) {
    const fullPath = path ? `${path}/${item.name}` : item.name;
    if (!item.metadata || !item.id) {
      const sub = await listFolder(bucket, fullPath);
      files = files.concat(sub);
    } else {
      files.push({ ...item, bucket, path: fullPath });
    }
  }
  return files;
}

async function run() {
  const { data: resources } = await supabase.from('resources').select('id, title, slug, type, file_url, courses(code, title)');
  const resMap = new Map();
  (resources || []).forEach(r => {
    const courseObj = Array.isArray(r.courses) ? r.courses[0] : r.courses;
    const courseCode = courseObj?.code || 'UNLINKED';
    const entry = { title: r.title, courseCode, slug: r.slug };
    if (r.file_url) {
      resMap.set(r.file_url, entry);
      const parts = r.file_url.split('/');
      resMap.set(parts[parts.length - 1], entry);
    }
  });

  const materialsFiles = await listFolder('studzy-materials');
  const ragFiles = await listFolder('RAG');
  const allFiles = [...materialsFiles, ...ragFiles];

  const totalBytes = allFiles.reduce((acc, f) => acc + (f.metadata?.size || 0), 0);
  const totalMB = totalBytes / (1024 * 1024);
  const targetMB = 1024;
  const needToDeleteMB = totalMB - targetMB;

  console.log(`\n=== STORAGE CONSUMPTION STATS ===`);
  console.log(`Current Total Storage Used: ${totalMB.toFixed(2)} MB`);
  console.log(`Target Limit (1 GB): 1024.00 MB`);
  console.log(`Minimum Space Needed to Delete: ${needToDeleteMB.toFixed(2)} MB (${(needToDeleteMB/1024).toFixed(2)} GB)\n`);

  // Group by Course Code
  const courseMap = {};
  allFiles.forEach(f => {
    const size = f.metadata?.size || 0;
    const mime = (f.metadata?.mimetype || '').toLowerCase();
    const ext = f.name.split('.').pop()?.toLowerCase() || '';

    let type = 'other';
    if (mime.startsWith('video/') || ['mp4', 'webm', 'mov'].includes(ext)) type = 'video';
    else if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) type = 'audio';
    else if (mime === 'application/pdf' || ext === 'pdf') type = 'pdf';

    const linked = resMap.get(f.name) || resMap.get(f.path);
    const courseCode = linked?.courseCode || f.path.split('/')[1] || 'Unlinked';

    if (!courseMap[courseCode]) {
      courseMap[courseCode] = { totalBytes: 0, videoBytes: 0, audioBytes: 0, pdfBytes: 0, files: [] };
    }

    courseMap[courseCode].totalBytes += size;
    if (type === 'video') courseMap[courseCode].videoBytes += size;
    if (type === 'audio') courseMap[courseCode].audioBytes += size;
    if (type === 'pdf') courseMap[courseCode].pdfBytes += size;

    courseMap[courseCode].files.push({ ...f, fileType: type, linked });
  });

  const sortedCourses = Object.entries(courseMap).sort((a, b) => b[1].totalBytes - a[1].totalBytes);

  console.log(`=== BREAKDOWN BY COURSE ===`);
  sortedCourses.forEach(([code, data]) => {
    console.log(`Course [${code}]: Total = ${(data.totalBytes/(1024*1024)).toFixed(2)} MB | Video = ${(data.videoBytes/(1024*1024)).toFixed(2)} MB | Audio = ${(data.audioBytes/(1024*1024)).toFixed(2)} MB | PDFs = ${(data.pdfBytes/(1024*1024)).toFixed(2)} MB`);
  });

  console.log(`\n=== LARGEST MEDIA FILES (AUDIO & VIDEO) ===`);
  const mediaFiles = allFiles
    .map(f => {
      const size = f.metadata?.size || 0;
      const mime = (f.metadata?.mimetype || '').toLowerCase();
      const ext = f.name.split('.').pop()?.toLowerCase() || '';
      let type = 'other';
      if (mime.startsWith('video/') || ['mp4', 'webm', 'mov'].includes(ext)) type = 'video';
      else if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) type = 'audio';
      return { ...f, size, fileType: type, linked: resMap.get(f.name) || resMap.get(f.path) };
    })
    .filter(f => f.fileType === 'video' || f.fileType === 'audio')
    .sort((a, b) => b.size - a.size);

  let accSaved = 0;
  mediaFiles.forEach((m, idx) => {
    accSaved += m.size;
    const currentTotal = totalMB - (accSaved / (1024*1024));
    const courseCode = m.linked?.courseCode || m.path.split('/')[1] || 'Unlinked';
    console.log(`#${idx+1} [${m.fileType.toUpperCase()}] ${m.name} | Course: ${courseCode} | Size: ${(m.size/(1024*1024)).toFixed(2)} MB | New Total Storage: ${currentTotal.toFixed(2)} MB`);
  });
}

run();
