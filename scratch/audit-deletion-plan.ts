import { listAllStorageObjectsWithResourceLinks } from "../src/lib/supabase/health/storage-management";

async function audit() {
  const files = await listAllStorageObjectsWithResourceLinks();
  const totalSizeBytes = files.reduce((acc, f) => acc + f.sizeBytes, 0);
  const totalMB = totalSizeBytes / (1024 * 1024);
  const targetMB = 1024; // 1 GB
  const toDeleteMB = totalMB - targetMB;

  console.log("==========================================");
  console.log(`CURRENT TOTAL STORAGE USED: ${totalMB.toFixed(2)} MB (${(totalMB / 1024).toFixed(2)} GB)`);
  console.log(`TARGET STORAGE LIMIT: ${targetMB.toFixed(2)} MB (1.00 GB)`);
  console.log(`MINIMUM SPACE TO DELETE: ${toDeleteMB.toFixed(2)} MB (${(toDeleteMB / 1024).toFixed(2)} GB)`);
  console.log("==========================================\n");

  // Group by course
  const courseMap: Record<
    string,
    {
      courseTitle: string;
      totalBytes: number;
      videoBytes: number;
      audioBytes: number;
      pdfBytes: number;
      otherBytes: number;
      videoCount: number;
      audioCount: number;
      files: typeof files;
    }
  > = {};

  for (const f of files) {
    const courseCode = f.linkedResource?.courseCode || f.path.split("/")[1] || "Unlinked/Other";
    const courseTitle = f.linkedResource?.courseTitle || courseCode;

    if (!courseMap[courseCode]) {
      courseMap[courseCode] = {
        courseTitle,
        totalBytes: 0,
        videoBytes: 0,
        audioBytes: 0,
        pdfBytes: 0,
        otherBytes: 0,
        videoCount: 0,
        audioCount: 0,
        files: [],
      };
    }

    courseMap[courseCode].totalBytes += f.sizeBytes;
    courseMap[courseCode].files.push(f);

    if (f.fileType === "video") {
      courseMap[courseCode].videoBytes += f.sizeBytes;
      courseMap[courseCode].videoCount += 1;
    } else if (f.fileType === "audio") {
      courseMap[courseCode].audioBytes += f.sizeBytes;
      courseMap[courseCode].audioCount += 1;
    } else if (f.fileType === "pdf") {
      courseMap[courseCode].pdfBytes += f.sizeBytes;
    } else {
      courseMap[courseCode].otherBytes += f.sizeBytes;
    }
  }

  const sortedCourses = Object.entries(courseMap).sort((a, b) => b[1].totalBytes - a[1].totalBytes);

  console.log("--- STORAGE CONSUMPTION BREAKDOWN BY COURSE ---");
  for (const [code, d] of sortedCourses) {
    const codeMB = (d.totalBytes / (1024 * 1024)).toFixed(2);
    const vMB = (d.videoBytes / (1024 * 1024)).toFixed(2);
    const aMB = (d.audioBytes / (1024 * 1024)).toFixed(2);
    const pMB = (d.pdfBytes / (1024 * 1024)).toFixed(2);
    console.log(
      `Course [${code}] (${d.courseTitle}): Total = ${codeMB} MB | Videos (${d.videoCount}) = ${vMB} MB | Audio (${d.audioCount}) = ${aMB} MB | PDFs = ${pMB} MB`
    );
  }

  console.log("\n--- LARGEST INDIVIDUAL AUDIO & VIDEO FILES OVERALL ---");
  const mediaFiles = files
    .filter((f) => f.fileType === "video" || f.fileType === "audio")
    .sort((a, b) => b.sizeBytes - a.sizeBytes);

  let cumulativeSavedBytes = 0;
  let count = 0;

  for (const m of mediaFiles) {
    count++;
    const fileMB = m.sizeBytes / (1024 * 1024);
    cumulativeSavedBytes += m.sizeBytes;
    const currentRemainingMB = totalMB - cumulativeSavedBytes / (1024 * 1024);
    const courseCode = m.linkedResource?.courseCode || m.path.split("/")[1] || "Unlinked";

    console.log(
      `#${count} [${m.fileType.toUpperCase()}] ${m.name} | Course: ${courseCode} | Size: ${fileMB.toFixed(
        2
      )} MB | Cumul. Saved: ${(cumulativeSavedBytes / (1024 * 1024)).toFixed(2)} MB | New Total Storage: ${currentRemainingMB.toFixed(
        2
      )} MB`
    );
  }
}

audit();
