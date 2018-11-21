'use strict'

const request_promise = require('request-promise')
const fs = require('fs')
const download = require('download')
const path = require('path')
const url = require('url')
const homedir = require('os').homedir()

// Binary responses, use encoding=null, otherwise default is utf8
function req(method, endpoint, processCallback, body, formData, contentType, encoding) {

	let config = JSON.parse(fs.readFileSync(homedir + '/.bwx/config.json'))

	if (!contentType) {
		contentType = 'application/json'
	}

	let options = {
		uri: config.url + endpoint,
		method: method,
		body: body,
		encoding: encoding,
		formData: formData,
		resolveWithFullResponse: true,
		headers: {
			'Content-Type': contentType,
			'User-Agent': 'BWX',
			'x-auth-token': config.api_token
		}
	}

	if (!processCallback) {
		request_promise(options)
			.then(function (response) {
				console.log(response.body)
				process.exitCode = 0
			})
			.catch(function (error) {
				console.log('Error ' + error.message)
				process.exitCode = 1
			})
	} else {
		request_promise(options).then(processCallback).catch(function(error) {
			console.log('Error ' + error.message)
			process.exitCode = 1
		})
	}
}

function login (configInput) {

	let data = {
		'accesskey': configInput.api_id,
		'secretAccesskey': configInput.api_secret
	}

	let options = {
		uri: configInput.url + '/api/pub/v1/login',
		body: JSON.stringify(data),
		method: 'POST',
		resolveWithFullResponse: true,
		headers: {
			'Content-Type': 'application/json'
		}
	}

	request_promise(options).then(function (response) {
		
		configInput.api_token = response.headers['x-auth-token']
		
		if (!fs.existsSync(homedir + '/.bwx')){
			fs.mkdirSync(homedir + '/.bwx')
		}

		fs.writeFileSync(homedir + '/.bwx/config.json', JSON.stringify(configInput, null, 2))

		console.log('Authentication successfull, config file created in ~/.bwx/config.json')
    })
    .catch(function (err) {
		console.log(err)
		process.exitCode = 1
    })
}

exports.login = function (config) {
	login(config)
}

exports.languages = function () {
	req('GET', '/api/pub/v1/language')
}

exports.timezones = function () {
	req('GET', '/api/pub/v1/timezone')
}

exports.services = function () {
	req('GET', '/api/pub/v1/service')
}

/**
 * Create a project in Bureau Works
 * @param {string} ref - a reference for the project
 * @param {string} src - source language
 * @param {string[]} tgt - an array with the target languages
 * @param {long[]} services - array with service IDs
 * @param {string} notes - some notes to go with the project information
 * @param {long} dd - desired delivery date
 */
exports.createProject = function (ref, src, tgt, services, notes, dd) {
	let body = {
		'reference' : ref,
		'sourceLanguage' : src,
		'targetLanguages' : tgt,
		'services' : services,
		'notes' : notes,
		'desiredDeliveryDate' : dd
	}

	req('POST', '/api/pub/v1/project', null, JSON.stringify(body))
}

/**
 * Upload file to a project
 * @param {long} projectId - the project ID returned in the project creation call
 * @param {long} serviceItemId - the service item ID, which comes inside the items array
 * @param {string} file - the file path
 */
exports.uploadFile = function (projectId, serviceItemId, file) {

	let formData = {
		file: fs.createReadStream(file)
	}

	req('POST', `/api/pub/v1/project/${projectId}/file/${serviceItemId}`, null, null, formData, null)
}

exports.uploadContinuous = function (file, tag, reference) {
	let formData = {
		reference: reference,
		file: fs.createReadStream(file)
	}

	req('POST', `/api/pub/v1/project/async/continuous/${tag}`, upsertCallback, null, formData, null)
}

function upsertCallback(asyncResponse) {

	let resp = JSON.parse(asyncResponse.body);
	let config = JSON.parse(fs.readFileSync(homedir + '/.bwx/config.json'))
	
	let formData = {
		requestId: resp.id
	}
	
	let options = {
		uri: config.url + `/api/pub/v1/project/async/continuous/${resp.data.productTag}`,
		method: 'POST',
		body: null,
		formData: formData,
		resolveWithFullResponse: true,
		headers: {
			'Content-Type': 'application/json',
			'User-Agent': 'BWX',
			'x-auth-token': config.api_token
		}
	}
	setInterval(function () { 

		request_promise(options)
			.then(function (response) {
				let resp = JSON.parse(response.body)
				if (resp.status == 'DONE') {
					// console.log(resp)
					process.exitCode = 0;
					process.exit(0);
				}
			
				if (resp.status == 'ERROR') {
					console.log('Error!! ' + resp.error)
					process.exitCode = 1
					process.exit(1);
				}
			})
			.catch(function (error) {
				console.log('Error ' + error.message)
				process.exitCode = 1
			});

	}, 5000);
}	

exports.readyProject = function (projectId) {
	req('POST', `/api/pub/v1/project/${projectId}/ready`)
}

exports.approveProject = function (projectId) {
	req('POST', `/api/pub/v1/project/${projectId}/approve`)
}

exports.completeProject = function (projectId) {
	req('POST', `/api/pub/v1/project/${projectId}/complete`)
}

exports.cancelProject = function (projectId) {
	req('POST', `/api/pub/v1/project/${projectId}/cancel`)
}

exports.projectsByStatus = function (status) {
	req('GET', `/api/pub/v1/project/?status=${status}`)
}

exports.getProject = function (projectId) {
	req('GET', `/api/pub/v1/project/${projectId}`)
}

exports.projectCosts = function (projectId) {
	req('GET', `/api/pub/v1/project/${projectId}/cost`)
}

exports.newDueDate = function (projectId, dueDate) {
	req('POST', `/api/pub/v1/project/${projectId}/due_date/${dueDate}`)
}

exports.projectItems = function (projectId) {
	req('GET', `/api/pub/v1/project/${projectId}/items`)
}

exports.approveJob = function (projectId, jobId) {
	req('POST', `/api/pub/v1/project/${projectId}/approve-job/${jobId}`)
}

exports.rejectJob = function (projectId, jobId, message) {
	req('POST', `/api/pub/v1/project/${projectId}/reject-job/${jobId}`, null, message)
}

exports.downloadFile = function (projectId, serviceItemId, filename, destinationPath, outputUrl) {

	function callback (response) {

		if (outputUrl) {
			console.log(response.body)
		}

		if (!destinationPath) {
			destinationPath = './'
		}

		let json = JSON.parse(response.body)

		// get just the filename component, it may be path/filename
		let f = path.posix.basename(filename)

		download(json.signed_request).pipe(fs.createWriteStream(`${destinationPath}/${f}`))
	}

	req('GET', `/api/pub/v1/project/${projectId}/${serviceItemId}/${filename}/`, callback)
}

exports.downloadContinuous = function (filename, tag, status, destinationPath) {

	function callback (response) {

		if (!destinationPath) {
			destinationPath = './'
		}

		fs.writeFileSync(`${tag}.zip`, response.body)

		process.exit(0)	
	}

	req('GET', `/api/pub/v1/project/continuous/${tag}/${filename}/?status=${status}`, callback, null, null, null, null)
}

exports.downloadFileByJobId = function (projectId, jobId, destinationPath, outputUrl) {

	function callback (response) {

		if (outputUrl) {
			console.log(response.body)
		}

		let json = JSON.parse(response.body)

		// get path component of url, last part is filename
		let urlPath = url.parse(json.signed_request).pathname
		let filename = path.posix.basename(urlPath)

		if (!destinationPath) {
			destinationPath = './'
		}

		download(json.signed_request).pipe(fs.createWriteStream(`${destinationPath}/${filename}`))
	}

	req('GET', `/api/pub/v1/project/${projectId}/delivered/${jobId}`, callback)
}
