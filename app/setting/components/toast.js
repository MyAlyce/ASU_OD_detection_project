export const VisibleToast = (message) => {
	return Toast({
		message,
		visible: true,
		duration: 2500,
	});
};
