import React from 'react';
import {Box, Text} from 'ink';

const Navigation = () => {
	return (
		<Box justifyContent="center" paddingY={1}>
			<Text color="gray">[←→] Navigate [Enter] Select [q] Quit [?] Help</Text>
		</Box>
	);
};

export default Navigation;
