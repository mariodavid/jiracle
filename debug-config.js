// Quick debug script to check configuration loading
import {readFileSync} from 'fs';
import {join} from 'path';
import {homedir} from 'os';

try {
	const configPath = join(homedir(), '.config', 'jiracle.json');
	console.log('Reading config from:', configPath);

	const configContent = readFileSync(configPath, 'utf8');
	console.log('Raw config file content:');
	console.log(configContent);

	const config = JSON.parse(configContent);
	console.log('\nParsed config object:');
	console.log(JSON.stringify(config, null, 2));

	console.log('\nChecking specific fields:');
	console.log('config.defaultTime:', config.defaultTime);
	console.log('config.favorites:', config.favorites);

	if (config.favorites) {
		config.favorites.forEach((fav, index) => {
			console.log(`Favorite ${index}:`, fav);
			console.log(`  key: ${fav.key}`);
			console.log(`  defaultTime: ${fav.defaultTime}`);
		});
	}
} catch (error) {
	console.error('Error reading config:', error.message);
}
