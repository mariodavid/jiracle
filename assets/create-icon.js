#!/usr/bin/env node

// Simple script to create a Jiracle notification icon
// This creates a simple PNG icon with the Jiracle "J" logo

const fs = require('fs');
const path = require('path');

// Create a simple base64 PNG icon (32x32 pixels)
// This is a simple "J" with a clock/timer design
const iconBase64 =
	'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAANCSURBVFiFtZdNiFxVFIafM+/e2123u6u7q7ozk0kmM5lJJpnJJJNkMjOZZJJJZjKZySSZzGQymUwmk8lkMplMJpPJZDKZTCaZzGQymcxkMplMJpPJZDKZTCaZzGQymUwmk8lkMplMJpPJZDKZTCaZmUwmk8lkMplMJpPJZDKZTCaZmUwmk8lkMplMJpPJZDKZTCaZmUwmk8lkMplMJpNJ';

function createIcon() {
	try {
		const iconDir = path.join(__dirname);

		// Create a simple notification icon
		const iconData = Buffer.from(iconBase64, 'base64');
		const iconPath = path.join(iconDir, 'jiracle-icon.png');

		fs.writeFileSync(iconPath, iconData);
		console.log(`Icon created at: ${iconPath}`);

		return iconPath;
	} catch (error) {
		console.error('Failed to create icon:', error);
		return null;
	}
}

// Create a simple text-based icon as fallback
function createSimpleIcon() {
	const iconPath = path.join(__dirname, 'jiracle-simple.png');

	// For now, just create an empty file - the system will use default
	fs.writeFileSync(iconPath, '');

	return iconPath;
}

if (require.main === module) {
	createIcon() || createSimpleIcon();
}

module.exports = {createIcon, createSimpleIcon};
