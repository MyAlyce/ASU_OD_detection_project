export const PrimaryButton = ({ label, onClick }) => {
	return Button({
		label,
		onClick,
		style: {
			boxShadow: 'none',
			background: '#0088EE',
			color: '#FFF',
			display: 'inline',
			fontSize: '12px',
		},
	});
};

export const XButton = (onClick) => {
	return Button({
		label: Image({ style: { width: '10px' }, src: xb64 }),
		onClick,
		style: {
			background: '#FF0000',
			borderRadius: '12px',
			boxShadow: 'none',
			color: '#FFF',
			fontSize: '12px',
			minWidth: '16px',
			minHeight: '16px',
			padding: '0',
		},
	});
};

const xb64 =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAA7EAAAOxAGVKw4bAAABdklEQVRIiZ2V3YrCMBBGi+xFKcUHK1L27cQLKRKWRUR8NFl63e/sRRONbTqNDgRCO7+HzExRRALsJHVAXbwpQA04SW3qZyGpAXpgAK5A9YbzytsM3kcDPBW887skIrnkBAEqSefYUNIdaIJCC/SSCAHCXdIN2C45l1RLui7Y9kBbAHtfWkoG4CZpVskES9JW0iEoujiLhLzg8jbnadaTCtzDBiiB44rBDdgyvpZr9D11OqCc8iwBt4bLHwuLmzmflO5C5kHeuD+xGM8uB1ceFiuIL3UJRT4WI0gurh8Ly8aIsWF8MXHQ2d07//oke6uJXhCx0IyW8/OSNwPXZTWINVty7ubsysAyMHbwZUVnjgs/co1ZhP9fS6qB32xcQA6WE9E7Z2zGLgsX6/Mn2USS1ppxAFwhqWVcc6lxbc4W7Gbsge+g2Ei6x2UCXSrzRJBS0nFi+wfsYqWCcVH3fDBbiGaXX5U74qUfKbbAwcJiBKkk7R9YvPwD3quO5XgK8UIAAAAASUVORK5CYII=';
