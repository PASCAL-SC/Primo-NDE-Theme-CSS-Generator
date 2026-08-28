const express = require('express');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

const app = express();

const PORT = 38127;

const ROOT_DIR = __dirname;

const NODE_MODULES = path.join(
    ROOT_DIR,
    'node_modules'
);

const TEMPLATE_FILE = path.join(
    ROOT_DIR,
    'templates',
    '_customized-theme.scss'
);

const WORK_DIR = path.join(
    ROOT_DIR,
    'work'
);


/*
 * Middleware
 */

app.use(express.json());

app.use(
    express.static(
        path.join(ROOT_DIR, 'public')
    )
);


/*
 * Make sure work directory exists
 */

fs.mkdirSync(
    WORK_DIR,
    {
        recursive: true
    }
);


/*
 * Validate colors
 */

function isValidColor(value) {

    return (
        typeof value === 'string' &&
        /^#[0-9a-fA-F]{6}$/.test(value)
    );

}

function isValidOptionalColor(value) {
    return (
        value == null ||
        isValidColor(value)
    );
}


/*
 * Generate theme
 */

app.post('/generate-theme', async (req, res) => {

    const {
        primary,
        secondary,
        tertiary,
        neutral
    } = req.body;


    /*
     * Validate input
     */

	if (
		!isValidColor(primary) ||
		!isValidOptionalColor(secondary) ||
		!isValidOptionalColor(tertiary) ||
		!isValidOptionalColor(neutral)
	) {

		return res
			.status(400)
			.send('Invalid color value.');
	}


    let tempDir = null;


    try {

        /*
         * Create a unique temporary directory
         * INSIDE the Angular workspace
         */

        tempDir = fs.mkdtempSync(
            path.join(
                WORK_DIR,
                'm3-theme-'
            )
        );


        /*
         * Angular wants --directory to be
         * relative to the workspace.
         */

		const relativeTempDir = path
			.relative(ROOT_DIR, tempDir)
			.replace(/\\/g, '/') + '/';
			
			


        /*
         * Angular CLI JavaScript entrypoint
         */

        const ngPath = path.join(
            ROOT_DIR,
            'node_modules',
            '@angular',
            'cli',
            'bin',
            'ng.js'
        );

		console.log('Generating theme in:', relativeTempDir);
        /*
         * Generate m3-theme.scss
         */

        const ngArgs = [

			ngPath,

			'generate',
			'@angular/material:m3-theme',

			'--primary-color',
			primary,

			'--theme-types',
			'both',

			'--use-system-variables',

			'--interactive',
			'false',

			'--force',

			'--directory',
			relativeTempDir

		];


		if (secondary) {

			ngArgs.push(
				'--secondary-color',
				secondary
			);

		}


		if (tertiary) {

			ngArgs.push(
				'--tertiary-color',
				tertiary
			);

		}


		if (neutral) {

			ngArgs.push(
				'--neutral-color',
				neutral
			);

		}


		await execFileAsync(
			process.execPath,
			ngArgs,
			{
				cwd: ROOT_DIR,
				timeout: 30000
			}
		);

		const themePath = path.join(
			tempDir,
			'm3-theme.scss'
		);

		if (!fs.existsSync(themePath)) {
			throw new Error(
				`Angular did not create expected theme file: ${themePath}`
			);
		}
		console.log('Theme file created:', themePath);

        /*
         * Copy wrapper SCSS into temp directory
         */

        const wrapperPath = path.join(
            tempDir,
            '_customized-theme.scss'
        );

        fs.copyFileSync(
            TEMPLATE_FILE,
            wrapperPath
        );


        /*
         * Sass JavaScript entrypoint
         */

        const sassPath = path.join(
            ROOT_DIR,
            'node_modules',
            'sass',
            'sass.js'
        );


        /*
         * CSS output path
         */

        const cssPath = path.join(
            tempDir,
            'customized-theme.css'
        );


        /*
         * Compile SCSS into CSS
         */

        await execFileAsync(
            process.execPath,
            [
                sassPath,

                '--load-path',
                NODE_MODULES,

                wrapperPath,

                cssPath,

                '--style=compressed',

                '--no-source-map'
            ],
            {
                cwd: tempDir,
                timeout: 30000
            }
        );


        /*
         * Read CSS into memory
         */

        const css = fs.readFileSync(
            cssPath
        );


        /*
         * Delete temp files
         */

        fs.rmSync(
            tempDir,
            {
                recursive: true,
                force: true
            }
        );

        tempDir = null;


        /*
         * Return CSS file
         */

        res.setHeader(
            'Content-Type',
            'text/css'
        );

        res.setHeader(
            'Content-Disposition',
            'attachment; filename="customized-theme.css"'
        );

        res.send(css);

    }
    catch (error) {

        console.error(error);


        /*
         * Clean temp directory if something failed
         */

        if (tempDir) {

            try {

                fs.rmSync(
                    tempDir,
                    {
                        recursive: true,
                        force: true
                    }
                );

            }
            catch (cleanupError) {

                console.error(
                    'Cleanup failed:',
                    cleanupError
                );

            }

        }


        res
            .status(500)
            .send('Unable to generate theme.');

    }

});


/*
 * Start server
 */

app.listen(
    PORT,
    '127.0.0.1',
    () => {

        console.log(
            `Theme generator running at http://127.0.0.1:${PORT}`
        );

    }
);
