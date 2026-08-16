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
    const entry = { title: r.title, courseCode, slug: r.slug, courseTitle: courseObj?.title || courseCode };
    if (r.file_url) {
      resMap.set(r.file_url, entry);
      const parts = r.file_url.split('/');
      resMap.set(parts[parts.length - 1], entry);
    }
  });

  const materialsFiles = await listFolder('studzy-materials');
  const ragFiles = await listFolder('RAG');
  const allFiles = [...materialsFiles, ...ragFiles];

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
    const courseCode = linked?.courseCode || f.path.split('/')[1] || 'Unlinked/Other';

    if (!courseMap[courseCode]) {
      courseMap[courseCode] = { totalBytes: 0, videoBytes: 0, audioBytes: 0, pdfBytes: 0, fileCount: 0, files: [] };
    }

    courseMap[courseCode].totalBytes += size;
    if (type === 'video') courseMap[courseCode].videoBytes += size;
    if (type === 'audio') courseMap[courseCode].audioBytes += size;
    if (type === 'pdf') courseMap[courseCode].pdfBytes += size;
    courseMap[courseCode].fileCount += 1;
    courseMap[courseCode].files.push({ ...f, fileType: type, size });
  });

  const totalBytes = allFiles.reduce((acc, f) => acc + (f.metadata?.size || 0), 0);
  const totalMB = totalBytes / (1024 * 1024);

  console.log(`\n==============================================`);
  console.log(`CURRENT TOTAL STORAGE: ${totalMB.toFixed(2)} MB (${(totalMB / 1024).toFixed(2)} GB)`);
  console.log(`TARGET MAX STORAGE: 1024.00 MB (1.00 GB)`);
  console.log(`SPACE TO FREE: ${(totalMB - 1024).toFixed(2)} MB`);
  console.log(`==============================================\n`);

  console.log(`COURSE STORAGE HEAVYWEIGHTS (SORTED BY TOTAL CONSUMPTION):\n`);
  Object.entries(courseMap)
    .sort((a, b) => b[1].totalBytes - a[1].totalBytes)
    .forEach(([code, d]) => {
      const totalMB = (d.totalBytes / (1024 * 1024)).toFixed(2);
      const vMB = (d.videoBytes / (1024 * 1024)).toFixed(2);
      const aMB = (d.audioBytes / (1024 * 1024)).toFixed(2);
      const pMB = (d.pdfBytes / (1024 * 1024)).toFixed(2);
      if (d.totalBytes > 10 * 1024 * 1024) {
        console.log(`📌 Course: ${code.padEnd(10)} | Total: ${totalMB.padStart(7)} MB | Videos: ${vMB.padStart(7)} MB | Audio: ${aMB.padStart(7)} MB | PDFs: ${pMB.padStart(6)} MB`);
      }
    });
}

run();
