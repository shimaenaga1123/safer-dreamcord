import fs from "node:fs/promises";
import path from "node:path";
import { rolldown } from "rolldown";

const projectRoot = process.cwd();

async function buildExtension() {
	const outputDir = path.join(projectRoot, "dist");

	try {
		await fs.rm(outputDir, { recursive: true, force: true });
	} catch (error) {
		if (error.code !== "ENOENT") {
			console.error("Error cleaning output directory:", error);
			throw error;
		}
	}
	await fs.mkdir(outputDir, { recursive: true });

	const bundle = await rolldown({
		input: {
			background: path.join(projectRoot, "src/background/background.js"),
			popup: path.join(projectRoot, "src/popup/popup.js"),
		},
		output: {
			dir: path.join(outputDir, "js"),
			format: "esm",
			entryFileNames: "[name].js",
		},
	});

	await bundle.write();

	const manifestSourcePath = path.join(projectRoot, "manifest.json");
	const manifestDestinationPath = path.join(outputDir, "manifest.json");
	const manifestContent = await fs.readFile(manifestSourcePath, "utf-8");
	const manifest = JSON.parse(manifestContent);

	manifest.background.service_worker = "background.js";
	manifest.action.default_popup = "popup.html";

	await fs.writeFile(
		manifestDestinationPath,
		JSON.stringify(manifest, null, 2),
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

	console.log("Extension built successfully with Rolldown!");
}

buildExtension().catch(console.error);
