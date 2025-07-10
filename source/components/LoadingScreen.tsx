import React from 'react';
import {Text, Box} from 'ink';
import {Spinner} from '@inkjs/ui';
import Gradient from 'ink-gradient';
import BigText from 'ink-big-text';

type LoadingScreenProps = {
	message?: string;
};

export default function LoadingScreen({
	message = 'Loading...',
}: LoadingScreenProps) {
	return (
		<Box
			flexDirection="column"
			alignItems="center"
			justifyContent="center"
			height={40}
		>
			<Text> </Text>
			<Gradient name="rainbow">
				<BigText text="JIRACLE" />
			</Gradient>
			<Text> </Text>
			<Spinner label={message} />
			<Text> </Text>
		</Box>
	);
}
