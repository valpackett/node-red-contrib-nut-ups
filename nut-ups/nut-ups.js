module.exports = function (RED) {
	'use strict'

	var execFile = require('child_process').execFile

	function NutUpsNode (config) {
		RED.nodes.createNode(this, config)
		var node = this

		node.config = config

		this.on('input', function (msg) {
			var ups = (msg.payload || {}).ups || node.config.ups
			execFile('upsc', [ups], function (err, stdout, stderr) {
				if (err) throw err
				var result = {}
				stdout.split('\n').forEach(function (line) {
					var kv = line.split(':')
					if (kv.length != 2) return
					var key = kv[0].split('.')
					key.reduce(function (obj, k) {
						k = k.trim()
						if (typeof obj[k] === 'undefined')
							obj[k] = {}
						return obj[k]
					}, result)['value'] = kv[1].trim()
				})
				node.send({ payload: result })
			})
		})

	}

	RED.nodes.registerType('nut-ups', NutUpsNode)
}
