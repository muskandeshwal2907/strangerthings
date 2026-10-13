import fs from "fs";

const file = "c:/Users/nilot/OneDrive/Desktop/STRANGERS THING NIL/lib/chapterQuestions.ts";
let content = fs.readFileSync(file, "utf-8");
content = content.replace(/"?correctAnswerId"?:\s*"[^"]*"/g, '"correctAnswerId": ""');
content = content.replace(/"?correctOrder"?:\s*\[[^\]]*\]/g, '"correctOrder": []');
fs.writeFileSync(file, content, "utf-8");
console.log("Sanitized lib/chapterQuestions.ts: All answers stripped from client bundle!");
