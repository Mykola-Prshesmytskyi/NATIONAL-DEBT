const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const source = path.join(root, "src", "html", "layout.html");
const target = path.join(root, "index.html");
const includePattern = /<!--\s*@include\s+(.+?)\s*-->/g;

function readWithIncludes(filePath, seen = new Set()) {
  if (seen.has(filePath)) {
    throw new Error(`Circular HTML include: ${filePath}`);
  }

  seen.add(filePath);
  const content = fs.readFileSync(filePath, "utf8");
  const directory = path.dirname(filePath);

  return content.replace(includePattern, (_match, includePath) => {
    const nextFile = path.resolve(directory, includePath.trim());
    return readWithIncludes(nextFile, new Set(seen));
  });
}

fs.writeFileSync(target, readWithIncludes(source));

