const cloudinary = require('cloudinary').v2

let cloudinaryConfigured = false

function normalizeEnvValue(value) {
	const text = String(value || '').trim()
	if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
		return text.slice(1, -1).trim()
	}
	return text
}

function getCloudinaryConfig() {
	const config = {
		cloud_name:
			normalizeEnvValue(process.env.APP_CLOUDINARY_CLOUD_NAME) ||
			normalizeEnvValue(process.env.CLOUDINARY_CLOUD_NAME) ||
			normalizeEnvValue(process.env.CLOUD_NAME) ||
			'',
		api_key:
			normalizeEnvValue(process.env.APP_CLOUDINARY_API_KEY) ||
			normalizeEnvValue(process.env.CLOUDINARY_API_KEY) ||
			normalizeEnvValue(process.env.API_KEY) ||
			'',
		api_secret:
			normalizeEnvValue(process.env.APP_CLOUDINARY_SECRET_KEY) ||
			normalizeEnvValue(process.env.APP_CLOUDINARY_API_SECRET) ||
			normalizeEnvValue(process.env.CLOUDINARY_API_SECRET) ||
			normalizeEnvValue(process.env.CLOUDINARY_SECRET) ||
			normalizeEnvValue(process.env.API_SECRET) ||
			'',
	}

	return config
}

exports.cloudinaryConnect = () => {
	if (cloudinaryConfigured) {
		return cloudinary
	}

	const config = getCloudinaryConfig()
	const missing = Object.entries(config)
		.filter(([, value]) => !String(value || '').trim())
		.map(([key]) => key)

	if (missing.length > 0) {
		const error = new Error(`Cloudinary configuration missing: ${missing.join(', ')}`)
		error.statusCode = 500
		throw error
	}

	cloudinary.config({
		...config,
		secure: true,
	})
	cloudinaryConfigured = true
	return cloudinary
}

exports.cloudinary = cloudinary