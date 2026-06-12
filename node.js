
const https = 		require('https');
const express = 	require('express');
const fs = 			require('fs');
const cors = 		require('cors');
const path = 		require('path');
const app = 			express();



// MIDDLEWARE
app.use(cors());
app.use(express.json());
app.use(express.static('public'));



// SECURE HTTPS OPTIONS
const httpsOptions = {
	key: fs.readFileSync('./key.pem'),
	cert: fs.readFileSync('./cert.pem')
	};



// SECURLY PUT VALUES
app.post('/api/save', (req, res) => {
	try {
		const { filename, content } = req.body;

		// VALIDATE INPUT TO PREVENT DIRECTORY TRAVERSAL
		if (!filename || filename.includes('..')) {
			return res.status(400).json({ error: 'Invalid filename' });
			}

		const filepath = path.join('./data', filename);
		
		// ENSURE FILE SAVED IN (./data) ONLY
		if (!filepath.startsWith(path.resolve('./data'))) {
			return res.status(403).json({ error: 'Access denied' });
			}

		// MAKE (/data/) IF NEEDED
		if (!fs.existsSync('./data')) {
			fs.mkdirSync('./data');
			}

		// SAVE FILE
		fs.writeFileSync( filepath, content, 'utf-8' );
		
		res.json({ 
			success: true, 
			message: `Saved to ${filename}`,
			timestamp: new Date().toISOString()
		});

	} catch (error) {
		console.error('Save error:', error);
		res.status(500).json({ error: error.message });
	}
});




// SECURELY GET FILE
app.get('/api/load/:filename', (req, res) => {
	try {
		const { filename } = req.params;

		// Validate filename (prevent directory traversal)
		if (!filename || filename.includes('..')) {
			return res.status(400).json({ error: 'Invalid filename' });
		}

		const filepath = path.join('./data', filename);

		// Ensure file is in ./data directory only
		if (!filepath.startsWith(path.resolve('./data'))) {
			return res.status(403).json({ error: 'Access denied' });
		}

		// Check if file exists
		if (!fs.existsSync(filepath)) {
			return res.status(404).json({ error: 'File not found' });
		}

		// Read and send file
		const content = fs.readFileSync(filepath, 'utf-8');
		
		res.json({ 
			success: true,
			filename: filename,
			content: content,
			timestamp: new Date().toISOString()
		});

	} catch (error) {
		console.error('Load error:', error);
		res.status(500).json({ error: error.message });
	}
});




// SECURELY DELETE FILE
app.delete('/api/delete/:filename', (req, res) => {
	try {
		const { filename } = req.params;

		if (!filename || filename.includes('..')) {
			return res.status(400).json({ error: 'Invalid filename' });
		}

		const filepath = path.join('./data', filename);

		if (!filepath.startsWith(path.resolve('./data'))) {
			return res.status(403).json({ error: 'Access denied' });
		}

		if (!fs.existsSync(filepath)) {
			return res.status(404).json({ error: 'File not found' });
		}

		fs.unlinkSync(filepath);
		
		res.json({ 
			success: true,
			message: `Deleted ${filename}`
		});

	} catch (error) {
		console.error('Delete error:', error);
		res.status(500).json({ error: error.message });
	}
});




// SECURELY LIST FILES
app.get('/api/list', (req, res) => {
	try {
		if (!fs.existsSync('./data')) {
			return res.json({ files: [] });
		}

		const files = fs.readdirSync('./data');
		res.json({ files: files });

	} catch (error) {
		console.error('List error:', error);
		res.status(500).json({ error: error.message });
	}
});




// START HTTPS SERVER
https.createServer(httpsOptions, app).listen(3000, () => {
	console.log( 'Server running on https://localhost:3000' );
	});
