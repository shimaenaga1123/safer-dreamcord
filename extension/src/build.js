import fs from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();

async function buildExtension() {
	const outputDir = path.join(projectRoot, "dist");

	await fs.rm(outputDir, { recursive: true, force: true });
	await fs.mkdir(outputDir, { recursive: true });

	await Bun.build({
		entrypoints: [
			path.join(projectRoot, "src/background/background.js"),
			path.join(projectRoot, "src/popup/popup.js"),
		],
		outdir: outputDir,
		format: "esm",
		minify: true,
		splitting: true,
		treeshaking: true,
		naming: "[name].js",
	});

	await fs.copyFile(
		path.join(projectRoot, "manifest.json"),
		path.join(outputDir, "manifest.json"),
	);

	await fs.copyFile(
		path.join(projectRoot, "src/popup/popup.html"),
		path.join(outputDir, "popup.html"),
	);

	await fs.copyFile(
		path.join(projectRoot, "src/popup/popup.css"),
		path.join(outputDir, "popup.css"),
	);

	const imagesSourcePath = path.join(projectRoot, "images");
	const imagesDestinationPath = path.join(outputDir, "images");
	await fs.cp(imagesSourcePath, imagesDestinationPath, { recursive: true });
}

buildExtension();