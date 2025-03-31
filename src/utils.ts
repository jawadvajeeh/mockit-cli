export const getType = function (value: unknown) {
	return Object.prototype.toString.call(value);
};