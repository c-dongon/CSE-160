export function subtractVec3(a, b) {
	const ae = a.elements ?? a;
	const be = b.elements ?? b;
	return new Vector3([
		ae[0] - be[0],
		ae[1] - be[1],
		ae[2] - be[2],
	]);
}

export function addVec3(a, b) {
	const ae = a.elements ?? a;
	const be = b.elements ?? b;
	return new Vector3([
		ae[0] + be[0],
		ae[1] + be[1],
		ae[2] + be[2],
	]);
}

export function scaleVec3(v, s) {
	const ve = v.elements ?? v;
	return new Vector3([
		ve[0] * s,
		ve[1] * s,
		ve[2] * s,
	]);
}

export function crossVec3(a, b) {
	const ae = a.elements ?? a;
	const be = b.elements ?? b;
	return new Vector3([
		ae[1] * be[2] - ae[2] * be[1],
		ae[2] * be[0] - ae[0] * be[2],
		ae[0] * be[1] - ae[1] * be[0]
	]);
}
