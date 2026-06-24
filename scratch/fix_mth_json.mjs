import fs from 'fs';

try {
  const rawText = fs.readFileSync('c:/users/samkiel/Downloads/mth202.json', 'utf8');
  
  // Replace all backslashes globally
  const fixedText = rawText.replace(/\\/g, '\\\\');
  
  // Verify it parses as valid JSON now
  const parsed = JSON.parse(fixedText);
  console.log(`Validation Success: Loaded ${parsed.length} questions successfully!`);
  
  // Save the fixed JSON
  fs.writeFileSync('c:/users/samkiel/Downloads/mth202_fixed.json', JSON.stringify(parsed, null, 2));
  console.log('Fixed file saved successfully to: c:/users/samkiel/Downloads/mth202_fixed.json');
} catch (err) {
  console.error('Error fixing JSON:', err.message);
}
