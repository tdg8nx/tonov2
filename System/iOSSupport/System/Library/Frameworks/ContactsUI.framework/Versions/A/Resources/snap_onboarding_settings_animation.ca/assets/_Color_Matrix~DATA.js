"use strict"
var G = this
clearLogging()

/*
NOTES:

TO DO:
- rework inspector to use arrays
-  Build Presets
-  Build out - psd compatibility && print psd mixer
- Add magnificationFilter to inspector layer exports
- make sure nsArrays are immediately converted: rdar://84774036


Good Padding Testing:

scriptComponents.Backdrop_Blender~COMP._ofstFilMtx
⟶ [-1.5, 0, 0, -1.5, 2]
[0, -1.5, 0, -1.5, 2]
[0, 0, -1.5, -1.5, 2]
[-0.2126, -0.7152, -0.0722, -0.6667, 0]






*/

G.____________DECLARATIONS = _ => _

var _aa = Array.from(Array(4))
var _isReady = 0
var _count = 0
var _matrixUndoCache = null
var _localAlphaFactor = 1
var _rgbToYccDoubleArray = null
var _yccToRgbDoubleArray = null
var _tickInterval = null
var _yccToRgbMatrix
var _rgbToYccMatrix

//--custom matrix arrays
var _preInputRelIdxArr = []
var _postInputRelIdxArr = []
var _preYCCRelIdxArr = []
var _postYCCRelIdxArr = []
var _preRGBRelIdxArr = []
var _postRGBRelIdxArr = []
var _preInputAbsIdxArr = []
var _postInputAbsIdxArr = []
var _preYCCAbsIdxArr = []
var _postYCCAbsIdxArr = []
var _preRGBAbsIdxArr = []
var _postRGBAbsIdxArr = []

var _vibrantKey = "filters.vibrantColorMatrix.inputColorMatrix"

//--declare component UI defaults
var _componentMiscKeys = [
	//--[ restorationType, property, default ]
	//--restorationType: 0=misc, 1=corrections

	//--general settings
	[0, "_details", "◦ Output Disabled"],
	[1, "_lumaContrast", 1],
	[1, "_lightness", 0],
	[1, "_brightness", 0],
	[1, "_saturation", 1],
	[1, "_hue", 0],
	[1, "_fill", new Color(0, .5, 1, 0)],
	[1, "_maskLuma", 0],

	//--output
	[0, "_lArr", []],
	[0, "_keyArr", []],

	//--i/o preview
	[0, "_usePreview", 0],
	[0, "_prevMac", null],
	[0, "_rgbCurvePreview", null],
	[0, "_rgbChannelPreview", null],
	[0, "_spectrumPreview", null],
	[0, "_psdOk", 0],
	[0, "_inspectors", []],
	[0, "_previewConfiguration", ["RGB Curves"]],
	[0, "_previewToLayer", []],
	[0, "_printPsdMixer", 0],

	//--component luminance
	[1, "_useComponentLuminance", 0],
	[0, "_redCyanLumaContrast", 0],
	[0, "_blueYellowLumaContrast", 0],

	//--component brightness
	[1, "_useComponentBrightness", 0],
	[0, "_antiYellowBrightness", 0],
	[0, "_antiCyanBrightness", 0],

	//--component saturation
	[1, "_useComponentSaturation", 0],
	[0, "_redCyanSaturation", 1],
	[0, "_blueYellowSaturation", 1],

	//--component hue
	[1, "_useComponentHue", 0],
	[0, "_blueYellowHue", 0],
	[0, "_redCyanHue", 0],

	//--modal colorization
	[1, "_useModalColorization", 0],
	[0, "_cbcrColor", new Color(0, .5, 1, 0)],
	[0, "_multiplyColor", new Color(0, .5, 1, 0)],
	[0, "_burnColor", new Color(0, .5, 1, 0)],
	[0, "_screenColor", new Color(0, .5, 1, 0)],
	[0, "_dodgeColor", new Color(0, .5, 1, 0)],
	[0, "_hardLightColor", new Color(0, .5, 1, 0)],
	[0, "_linearLightColor", new Color(0, .5, 1, 0)],
	[0, "_maskedColor", new Color(0, .5, 1, 0)],
	[0, "_linearHighlights", new Color(0, .5, 1, 0)],
	[0, "_linearShadows", new Color(0, .5, 1, 0)],
	[0, "_exclusionColor", new Color(0, .5, 1, 0)],
	[0, "_colorAlphaFactor", 1],

	//--mask rgb
	[1, "_useMaskRGB", 0],
	[0, "_maskRed", 0],
	[0, "_maskGreen", 0],
	[0, "_maskBlue", 0],

	//--pad input
	[1, "_useSmoothPad", 0],
	[0, "_padThreshold", .8],
	[0, "_padAmount", .1],
	[0, "_padBend", .7],
	[0, "_padKr", .2126],
	[0, "_padKg", .7152],

	//--lift input
	[1, "_useSmoothLift",0],
	[0, "_liftAmount",.1],
	[0, "_liftBend",.7],
	[0, "_liftThreshold", 0],
	[0, "_liftKr", 1/3],
	[0, "_liftKg", 1/3],

	//--custom matrices
	[1, "_useCustomMatrices", 0],
	[0, "_inputMatrix", null],
	[0, "_outputMatrix", null],
	[0, "_preYCCMatrix", null],
	[0, "_postYCCMatrix", null],
	[0, "_preRGBMatrix", null],
	[0, "_postRGBMatrix", null],

	//--preferences
	[0, "_useCustomYcc", 0],
	[0, "_Kr", 0.2126],
	[0, "_Kg", 0.7152],
	[0, "_Kb", 0.0722],

	[0, "_useQuantize", 1],
	[0, "_quantizeSteps", 1000],
	[0, "_zeroThreshold", 0],
];
//--declare component UI setters
for (let i = 0, k; i < _componentMiscKeys.length; i++) {
	k = _componentMiscKeys[i][1]
	G[k] = _componentMiscKeys[i][2]

	//--create global setter
	//--(use global set… functions to prevent default setters)
	//--(use global on… functions to add to default setters)
	G["set" + k] = G["set" + k] || function(a, skipRunFn) {
		G[k] = a
		if (!_isReady) return
		if (G["on" + k]) G["on" + k](a)
		instance.valueChanged(k)
		if (!skipRunFn) run()
	}
}
// [null, "applyYccContrast", true],
var _workflow = [
	//--[0]: default_i(currently not used), 
	//--[1]: Fn, 
	//--[2]: enablingStringBool(true»always enabled),
	//--[3]: enablingLengthBool

	//--input section
	[5, "applyInputPad", "_useSmoothPad"],
	[5, "applyInputLift", "_useSmoothLift"],
	[2, "applyInput", "_inputMatrix"],

	//--ycc section
	[5, "applyRgbToYcc", true],
	[6, "applyPreYcc", "_useCustomMatrices"],
	[8, "applyYccContrast", true],
	[8, "applyYccComponentContrast", "_useComponentLuminance"],
	[9, "applyYccLightness", true],
	[10, "applyYccBrightness", true],
	[11, "applyYccAntiBrightness", "_useComponentBrightness"],
	[12, "applyYccSaturation", true],
	[13, "applyBlueYellowSaturation", "_useComponentSaturation"],
	[14, "applyRedCyanSaturation", "_useComponentSaturation"],
	[15, "applyHue", true],
	[16, "applyBlueYellowHue", "_useComponentHue"],
	[17, "applyRedCyanHue", "_useComponentHue"],
	[18, "applyCbcrColor", "_useModalColorization"],
	[5, "applyPostYcc", "_useCustomMatrices"],
	[21, "applyYccToRgb", true],
	[5, "applyPreRgb", "_useCustomMatrices"],

	//--rgb section
	[24, "applyMaskedColor", "_useModalColorization"],
	[25, "applyLinearHighlights", "_useModalColorization"],
	[26, "applyLinearShadows", "_useModalColorization"],
	[27, "applyScreenColor", "_useModalColorization"],
	[28, "applyDodgeColor", "_useModalColorization"],
	[29, "applyMultiplyColor", "_useModalColorization"],
	[30, "applyBurnColor", "_useModalColorization"],
	[31, "applyHardLightColor", "_useModalColorization"],
	[32, "applyLinearLightColor", "_useModalColorization"],
	[33, "applyExclusionColor", "_useModalColorization"],
	[34, "applySolidFill", true],
	[35, "applyMaskLuminance", true],
	[36, "applyMaskRed", "_useMaskRGB"],
	[37, "applyMaskGreen", "_useMaskRGB"],
	[38, "applyMaskBlue", "_useMaskRGB"],
	[39, "applyQuantize", "_useQuantize"],
	[5, "applyPostRgb", "_useCustomMatrices"],
]

G.____________INIT_FUNCTIONS = _ => _

function init() {
	updateConversionMatrices()
	if (_lArr.length === 0) {
		_lArr = [layer]
		instance.valueChanged("_lArr")
	}
	//--
	buildInspectorBackgrounds()
	clearInterval(_tickInterval)
	_tickInterval = setInterval(tick, .5)
	_isReady = 1
	run()
}

function updateConversionMatrices() {
	_rgbToYccDoubleArray = rgbToYccDoubleArrayFromCbCrConstants(
		_Kr,
		_Kg,
		_Kb
	)
	_yccToRgbDoubleArray = yccToRgbDoubleArrayFromCbCrConstants(
		_Kr,
		_Kg,
		_Kb
	)
}

G.____________RUN_FUNCTIONS = _ => _

function setCustomMatricestoDefaultValuesIfMissing() {
	if (!_inputMatrix || _inputMatrix.m11 == null) {
		_inputMatrix = doubleArrayToMatrix(newDoubleArray())
		instance.valueChanged("_inputMatrix")
	}
	if (!_preYCCMatrix || _preYCCMatrix.m11 == null) {
		_preYCCMatrix = doubleArrayToMatrix(newDoubleArray())
		instance.valueChanged("_preYCCMatrix")
	}
	if (!_postYCCMatrix || _postYCCMatrix.m11 == null) {
		_postYCCMatrix = doubleArrayToMatrix(newDoubleArray())
		instance.valueChanged("_postYCCMatrix")
	}
	if (!_preRGBMatrix || _preRGBMatrix.m11 == null) {
		_preRGBMatrix = doubleArrayToMatrix(newDoubleArray())
		instance.valueChanged("_preRGBMatrix")
	}
	if (!_postRGBMatrix || _postRGBMatrix.m11 == null) {
		_postRGBMatrix = doubleArrayToMatrix(newDoubleArray())
		instance.valueChanged("_postRGBMatrix")
	}
}

function run() {
	if (!_isReady) return
	if (_useCustomMatrices) {
		setCustomMatricestoDefaultValuesIfMissing()
	}
	if (_needsConversionMaticesUpdate) {
		_needsConversionMaticesUpdate = 0
		updateConversionMatrices()
	}

	//--apply cxs to new dbl array (with enabling bool check)
	_aa = newDoubleArray()
	for (let i = 0, w = _workflow, len = w.length; i < len; i++) {

		//--apply standard corrections (always on)
		if (w[i][2] === true) { _aa = G[w[i][1]](_aa) }

		//--apply corrections (bool enabled)
		else if (w[i][2] && G[w[i][2]]) _aa = G[w[i][1]](_aa)
	}
	//--update inspector previews
	if (_usePreview) runInspector(_aa)

	//--convert final double array to matrix object
	const m = doubleArrayToMatrix(_aa)
	if (_useCustomMatrices) {
		_outputMatrix = m
		instance.valueChanged("_outputMatrix")
	} else if (_outputMatrix) {
		_outputMatrix = null
		instance.valueChanged("_outputMatrix")
	}
	//--output to color matrix filter
	if (_details.startsWith("• C")) {
		outputMatrixToOrderedIndex(m)
	}
	//--output to vibrant color matrix filter
	else if (_details.startsWith("• V")) {
		outputMatrixToVibrantColorMatrixFilter(m)
	}
	else if (_details.startsWith("• R")) {
		//--under construction
	}
	//--output to key paths
	else if (_details === "• Output to Keypath(s)") {
		outputMatrixToKeyPathList(m)
	}

}

function set_details(a, skipRunFn) {
	if (!_isReady) { _details = a; return }

	//--restore last popup value if not a bulleted selection
	if (a[0] === "•" || a[0] === "◦") _details = a
	else instance.valueChanged("_details")

	if (a === "☰ Reset To Neutral Default Corrections") {
		for (let i = 0, a; i < _componentMiscKeys.length; i++) {
			a = _componentMiscKeys[i]
			if (a[0] !== 1) continue
			G[a[1]] = a[2]
			instance.valueChanged(a[1])
		}
	}
	//--
	if ("☰ Smooth Colorization (masked)") {
		//(100% 'luma mask' and 'linear highlight' color)
		//--under construction
	}
	if ("☰ Smooth Highlight Padding (masked)") {
		//(100% 'luma mask', Contrast, Brightness, and Saturation)
		//--under construction
	}
	if (!skipRunFn) run()
}

var _needsConversionMaticesUpdate = 0

function on_useCustomYcc(a) { _needsConversionMaticesUpdate = 1 }

function on_Kr(a) { _needsConversionMaticesUpdate = 1 }

function on_Kg(a) { _needsConversionMaticesUpdate = 1 }

function on_Kb(a) { _needsConversionMaticesUpdate = 1 }

G.____________LOOP = _ => _

function tick() {}

G.____________OUTPUT = _ => _

function outputMatrixToKeyPathList(m) {
	Transaction.disableActions = true
	_lArr = _lArr || [], _keyArr = _keyArr || []
	for (let i = 0, k; i < _lArr.length; i++) {
		k = _keyArr[i]
		if (!k || k[0] === "/") continue
		_lArr[i].setValueForKeyPath(m, k)
	}
}

function outputMatrixToVibrantColorMatrixFilter(m) {
	for (let i = 0, l, fArr, k; i < _lArr.length; i++) {
		l = _lArr[i]
		if (!l) continue

		//--add a filter if none
		fArr = l.filters || []
		if (!fArr.length) {
			fArr = setFiltersToOneVibrantColorMatrixAndReturnRef(l)
		}
		//--loop through filter array
		for (let j = 0, f; j < fArr.length; j++) {
			f = fArr[j]
			if (f && f.type === "vibrantColorMatrix" && f.enabled) {
				Transaction.disableActions = true
				l.setValueForKeyPath(m, _vibrantKey)
				break
			}
		}
	}
}

function outputMatrixToOrderedIndex(m) {
	let heroI = ~~_details[15] - 1
	if (heroI < 0) return

	//--loop through layers
	for (let i = 0, l, fArr, k; i < _lArr.length; i++) {
		let matricesByIndex = []
		l = _lArr[i]
		if (!l) continue

		//--add a filter if none
		fArr = l.filters || []
		if (!fArr.length) {
			fArr = setFiltersToOneColorMatrixAndReturnRef(l)
		}
		//--loop through filter array
		for (let j = 0, f; j < fArr.length; j++) {
			f = fArr[j]
			if (!f || f.type !== "colorMatrix") continue
			// print(l.name, ": ", f.type)
			matricesByIndex.push({
				l: l,
				k: "filters." + f.name + ".inputColorMatrix",
			})
		}
		Transaction.disableActions = true
		let o = matricesByIndex[heroI]
		if (o) o.l.setValueForKeyPath(m, o.k)
		// if (o) print(o.k)
	}
}

G.____________CUSTOM_MATRIX_FUNCTIONS = _ => _

G.____________CORRECTION_FUNCTIONS = _ => _

function applyMaskLuminance(aa) {
	const a = _rgbToYccDoubleArray[0]
	return maskDoubleArrayUsingRGB(aa, a[0], a[1], a[2], _maskLuma)
}

function applyMaskRed(aa) {
	if (!_useMaskRGB) return aa
	const a = aa[3]
	return maskDoubleArrayUsingRGB(aa, 1, a[1], a[2], _maskRed)
}

function applyMaskGreen(aa) {
	if (!_useMaskRGB) return aa
	const a = aa[3]
	return maskDoubleArrayUsingRGB(aa, a[0], 1, a[2], _maskGreen)
}

function applyMaskBlue(aa) {
	if (!_useMaskRGB) return aa
	const a = aa[3]
	return maskDoubleArrayUsingRGB(aa, a[0], a[1], 1, _maskBlue)
}

function applyRgbToYcc(aa) {
	return aa ?
		concatDoubleArrays(_rgbToYccDoubleArray, aa) :
		_rgbToYccDoubleArray
}

function applyYccToRgb(aa) {
	return aa ?
		concatDoubleArrays(_yccToRgbDoubleArray, aa) :
		_yccToRgbDoubleArray
}

function applyYccContrast(aa) {
	const n = (_lumaContrast - 1)
	const m11 = n + 1
	const m15 = -n / 2
	return concatDoubleArrays([
		[m11, 0, 0, 0, m15],
		[0, 1, 0, 0, 0],
		[0, 0, 1, 0, 0],
		[0, 0, 0, 1, 0]
	], aa)
}

function applyYccComponentContrast(aa) {
	const m12 = _blueYellowLumaContrast
	const m13 = _redCyanLumaContrast
	const m15 = -m12 / 2 - m13 / 2
	return concatDoubleArrays([
		[1, m12, m13, 0, m15],
		[0, 1, 0, 0, 0],
		[0, 0, 1, 0, 0],
		[0, 0, 0, 1, 0]
	], aa)
}

function applyCbcrColor(aa) {
	let a = colorToArray(_cbcrColor)
	a[3] *= _colorAlphaFactor
	a = transformColorArrayViaMatrix(a, _rgbToYccDoubleArray)
	aa[1][4] += (a[1] - .5) * a[3]
	aa[2][4] += (a[2] - .5) * a[3]
	return aa
}

function applyHue(aa) {
	const s = Math.sin(_hue)
	const c = Math.cos(_hue) - 1
	return concatDoubleArrays([
		[1, 0, 0, 0, 0],
		[0, 1 + c, -s, 0, s / 2 - c / 2],
		[0, +s, 1 + c, 0, -s / 2 - c / 2],
		[0, 0, 0, 1, 0]
	], aa)
}

function applyBlueYellowHue(aa) {
	return concatDoubleArrays([
		[1, 0, 0, 0, 0],
		[0, 1, -_blueYellowHue, 0, _blueYellowHue / 2],
		[0, 0, 1, 0, 0],
		[0, 0, 0, 1, 0]
	], aa)
}

function applyRedCyanHue(aa) {
	return concatDoubleArrays([
		[1, 0, 0, 0, 0],
		[0, 1, 0, 0, 0],
		[0, _redCyanHue, 1, 0, -_redCyanHue / 2],
		[0, 0, 0, 1, 0]
	], aa)
}

function applyMaskedColor(aa) {
	let a = colorToArray(_maskedColor)
	a[3] *= _colorAlphaFactor
	for (let i = 0; i < 3; i++) {
		a[i] = map(a[3], 0, 1, .5, a[i])
	}
	return concatDoubleArrays([
		[2 * a[0], 0, 0, 0, 0],
		[0, 2 * a[1], 0, 0, 0],
		[0, 0, 2 * a[2], 0, 0],
		[0, 0, 0, 1, 0]
	], aa)
}

function applyLinearHighlights(aa) {
	let a = colorToArray(_linearHighlights)
	a[3] *= _colorAlphaFactor
	for (let i = 0; i < 3; i++) {
		a[i] = map(a[3], 0, 1, .5, a[i])
		if (a[i] > .5) a[i] = .5 / (1 - a[i] || Number.EPSILON)
		else a[i] *= 2
	}
	return concatDoubleArrays([
		[a[0], 0, 0, 0, 0],
		[0, a[1], 0, 0, 0],
		[0, 0, a[2], 0, 0],
		[0, 0, 0, 1, 0]
	], aa)
}

function applyLinearShadows(aa) {
	let a = colorToArray(_linearShadows)
	a[3] *= _colorAlphaFactor
	for (let i = 0; i < 3; i++) {
		a[i] = map(a[3], 0, 1, .5, 1 - a[i])
		if (a[i] > .5) a[i] = .5 / (1 - a[i] || Number.EPSILON)
		else a[i] *= 2
	}
	return concatDoubleArrays([
		[a[0], 0, 0, 0, 1 - a[0]],
		[0, a[1], 0, 0, 1 - a[1]],
		[0, 0, a[2], 0, 1 - a[2]],
		[0, 0, 0, 1, 0]
	], aa)
}

function applyMaskedColor(aa) {
	let a = colorToArray(_maskedColor)
	a[3] *= _colorAlphaFactor
	for (let i = 0; i < 3; i++) {
		a[i] = map(a[3], 0, 1, .5, a[i])
	}
	return concatDoubleArrays([
		[2 * a[0], 0, 0, 0, 0],
		[0, 2 * a[1], 0, 0, 0],
		[0, 0, 2 * a[2], 0, 0],
		[0, 0, 0, 1, 0]
	], aa)
}

function applyMultiplyColor(aa) {
	let a = colorToArray(_multiplyColor)
	a[3] *= _colorAlphaFactor
	for (let i = 0; i < 3; i++) a[i] = map(a[3], 0, 1, 1, a[i])
	return concatDoubleArrays([
		[a[0], 0, 0, 0, 0],
		[0, a[1], 0, 0, 0],
		[0, 0, a[2], 0, 0],
		[0, 0, 0, 1, 0]
	], aa)
}

function applyScreenColor(aa) {
	let a = colorToArray(_screenColor)
	let b = [...a]
	a[3] *= _colorAlphaFactor
	for (let i = 0; i < 3; i++) {
		a[i] = map(a[3], 0, 1, 1, 1 - a[i])
		b[i] = map(b[3], 0, 1, 0, b[i])
	}
	return concatDoubleArrays([
		[a[0], 0, 0, 0, b[0]],
		[0, a[1], 0, 0, b[1]],
		[0, 0, a[2], 0, b[2]],
		[0, 0, 0, 1, 0]
	], aa)
}

function applyDodgeColor(aa) {
	let a = colorToArray(_dodgeColor)
	a[3] *= _colorAlphaFactor
	for (let i = 0; i < 3; i++) {
		a[i] = 1 + (a[i] * a[3]) / (1 - a[i] || Number.EPSILON)
	}
	return concatDoubleArrays([
		[a[0], 0, 0, 0, 0],
		[0, a[1], 0, 0, 0],
		[0, 0, a[2], 0, 0],
		[0, 0, 0, 1, 0]
	], aa)
}

function applyBurnColor(aa) {
	let a = colorToArray(_burnColor)
	a[3] *= _colorAlphaFactor
	for (let i = 0; i < 3; i++) {
		a[i] = 1 + (1 / (a[i] || Number.EPSILON) - 1) * a[3]
	}
	return concatDoubleArrays([
		[a[0], 0, 0, 0, 1 - a[0]],
		[0, a[1], 0, 0, 1 - a[1]],
		[0, 0, a[2], 0, 1 - a[2]],
		[0, 0, 0, 1, 0]
	], aa)
}

function applyExclusionColor(aa) {
	let a = colorToArray(_exclusionColor)
	a[3] *= _colorAlphaFactor
	for (let i = 0; i < 3; i++) {
		a[i] *= a[3]
	}
	return concatDoubleArrays([
		[1 - a[0] * 2, 0, 0, 0, a[0]],
		[0, 1 - a[1] * 2, 0, 0, a[1]],
		[0, 0, 1 - a[2] * 2, 0, a[2]],
		[0, 0, 0, 1, 0]
	], aa)
}

function applyHardLightColor(aa) {
	let a = colorToArray(_hardLightColor)
	let b = [0, 0, 0, 0]
	let v = []
	let f = []
	a[3] *= _colorAlphaFactor
	for (let i = 0; i < 3; i++) {
		if (a[i] > .5) {
			a[i] = map(a[i], .5, 1, 0, 1) //last 2 can swap
			v[i] = map(a[3], 0, 1, 1, 1 - a[i])
			f[i] = map(a[3], 0, 1, 0, a[i])
		} else {
			a[i] = map(a[i], .5, 0, 0, 1) //last 2 can swap
			v[i] = map(a[3], 0, 1, 1, 1 - a[i])
			f[i] = 0 //map(b[3], 0, 1, 0, b[i])
		}
	}
	return concatDoubleArrays([
		[v[0], 0, 0, 0, f[0]],
		[0, v[1], 0, 0, f[1]],
		[0, 0, v[2], 0, f[2]],
		[0, 0, 0, 1, 0]
	], aa)
}

function applyLinearLightColor(aa) {
	let a = colorToArray(_linearLightColor)
	a[3] *= _colorAlphaFactor * 2
	for (let i = 0; i < 3; i++) aa[i][4] += (a[i] - .5) * a[3]
	return aa
}

function applyYccBrightness(aa) {
	aa[0][4] += _brightness
	return aa
}

function applyYccAntiBrightness(aa) {
	aa[0][1] += _antiYellowBrightness
	aa[0][2] += _antiCyanBrightness
	return aa
}

function applyYccLightness(aa) {
	const n = _lightness
	return concatDoubleArrays([
		[1 - Math.abs(n), 0, 0, 0, Math.max(0, n)],
		[0, 1, 0, 0, 0],
		[0, 0, 1, 0, 0],
		[0, 0, 0, 1, 0]
	], aa)
}

function applyYccSaturation(aa) {
	const n = _saturation
	const f = -n / 2 + .5
	return concatDoubleArrays([
		[1, 0, 0, 0, 0],
		[0, n, 0, 0, f],
		[0, 0, n, 0, f],
		[0, 0, 0, 1, 0]
	], aa)
}

function applyBlueYellowSaturation(aa) {
	const n = _blueYellowSaturation
	const f = -n / 2 + .5
	return concatDoubleArrays([
		[1, 0, 0, 0, 0],
		[0, n, 0, 0, f],
		[0, 0, 1, 0, 0],
		[0, 0, 0, 1, 0]
	], aa)
}

function applyRedCyanSaturation(aa) {
	const n = _redCyanSaturation
	const f = -n / 2 + .5
	return concatDoubleArrays([
		[1, 0, 0, 0, 0],
		[0, 1, 0, 0, 0],
		[0, 0, n, 0, f],
		[0, 0, 0, 1, 0]
	], aa)
}

function applySolidFill(aa) {
	let a = toColorArrFn(_fill)
	a[3] *= _colorAlphaFactor
	const bb = [
		[0, 0, 0, 0, a[0]],
		[0, 0, 0, 0, a[1]],
		[0, 0, 0, 0, a[2]],
		[0, 0, 0, 1, 0]
	]

	return mixDoubleArrays(bb, aa, a[3])
}

function applyQuantize(aa) {
	aa = quantizeColorMatrixDoubleArrayFn(aa, _quantizeSteps)
	aa = zapColorMatrixDoubleArrayFn(aa, _zeroThreshold)
	return aa
}

function applyInput(aa) {
	return concatDoubleArrays(
		matrixToDoubleArray(_inputMatrix), aa
	)
}

function applyPreYcc(aa) {
	return concatDoubleArrays(
		matrixToDoubleArray(_preYCCMatrix), aa
	)
}

function applyPostYcc(aa) {
	return concatDoubleArrays(
		matrixToDoubleArray(_postYCCMatrix), aa
	)
}

function applyPreRgb(aa) {
	return concatDoubleArrays(
		matrixToDoubleArray(_preRGBMatrix), aa
	)
}

function applyPostRgb(aa) {
	return concatDoubleArrays(
		matrixToDoubleArray(_postRGBMatrix), aa
	)
}

function applyInputPad(aa) {
	const thresh = Math.min(_padThreshold, .9999)
	const bend = Math.min(1 / (1 - _padBend) - 1, 9999)
	const fill = bend + _padAmount / (thresh - 1)
	const value = 1 - bend
	const Kb = 1 - _padKr - _padKg
	return concatDoubleArrays([
		[value, 0, 0, 0, fill],
		[0, value, 0, 0, fill],
		[0, 0, value, 0, fill],
		[_padKr, _padKg, Kb, -thresh, 0],
	], aa)

}

function applyInputLift(aa) {
	const thresh = Math.max(1 - _liftThreshold, .0001)
	const fill = _liftAmount / thresh
	const bend = Math.max(2 - 1 / (1 - _liftBend), -9999)
	const Kb = 1 - _liftKr - _liftKg
	return concatDoubleArrays([
		[bend, 0, 0, 0, fill],
		[0, bend, 0, 0, fill],
		[0, 0, bend, 0, fill],
		[-_liftKr, -_liftKg, -Kb, thresh, 0],
	], aa)

}

G.____________SUPPORT_FUNCTIONS = _ => _

function mixDoubleArrays(aa, bb, aaPerc) {
	let c, AA = Array.from(Array(4), () => [])
	for (let i = 0; i < 5; i++) {
		for (let j = 0; j < 4; j++) {
			AA[j][i] = aa[j][i] * aaPerc + bb[j][i] * (1 - aaPerc)
		}
	}
	return AA
}

function setFiltersToOneColorMatrixAndReturnRef(l) {
	l.filters = [
		new Filter("colorMatrix")
	]
	return l.filters
}

function setFiltersToOneVibrantColorMatrixAndReturnRef(l) {
	l.filters = [
		new Filter("vibrantColorMatrix")
	]
	return l.filters
}

function rgbToYccDoubleArrayFromCbCrConstants(Kr, Kg, Kb) {
	const invKb = 1 - Kb || Number.EPSILON
	const invKr = 1 - Kr || Number.EPSILON
	return [
		[Kr, Kg, Kb, 0, 0],
		[-.5 * Kr / invKb, -.5 * Kg / invKb, .5, 0, .5],
		[.5, -.5 * Kg / invKr, -.5 * Kb / invKr, 0, .5],
		[0, 0, 0, 1, 0],
	]
}

function yccToRgbDoubleArrayFromCbCrConstants(Kr, Kg, Kb) {
	const a02 = 2 - 2 * Kr
	const a21 = 2 - 2 * Kb
	const a11 = -Kb / (Kg || Number.EPSILON) * a21
	const a12 = -Kr / (Kg || Number.EPSILON) * a02
	return [
		[1, 0.0, a02, 0, a02 * -.5],
		[1, a11, a12, 0, a12 * -.5 + a11 * -.5],
		[1, a21, 0.0, 0, a21 * -.5],
		[0, 0.0, 0.0, 1, 0],
	]
}

function transformColorArrayViaMatrix(cA, aa) {
	/* Simple Transform Color Array Using 5x4 Color Matrix
	 */
	const dotProduct = function(a, b) {
		return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]
	};
	//--process colors
	let a = []
	for (let i = 0; i < 4; i++) {
		a[i] = dotProduct(cA, aa[i]) + aa[i][4]
	}
	return [a[0], a[1], a[2], a[3]]
}

function maskDoubleArrayUsingRGB(aa, r, g, b, n) {
	if (n > 0) aa[3] = mix([-r, -g, -b, 1, 0], aa[3], n)
	else if (n < 0) aa[3] = mix([r, g, b, 0, 0], aa[3], -n)
	return aa
}

function colorToArray(c) {
	/* Color To Array v2014-00-00 */
	if (Array.isArray(c)) return c
	if (!c) print("❌ Color Error: ", fnStack(), c)
	return [
		c.redComponent(),
		c.greenComponent(),
		c.blueComponent(),
		c.alpha()
	]
}

function doubleArrayToMatrix(rA_, gA, bA, aA) {
	/* Return Matrix v2022-01-27a */
	const t = Object.prototype.toString.call(rA_)
	if (t === "[object ColorMatrix]") {
		rA_ = [
			[m.m11, m.m12, m.m13, m.m14, m.m15],
			[m.m21, m.m22, m.m23, m.m24, m.m25],
			[m.m31, m.m32, m.m33, m.m34, m.m35],
			[m.m41, m.m42, m.m43, m.m44, m.m45]
		]
	}
	if (!gA) {
		gA = rA_[1], bA = rA_[2]
		aA = rA_[3], rA_ = rA_[0]
	}
	let m = new ColorMatrix();
	m.m11 = rA_[0], m.m12 = rA_[1], m.m13 = rA_[2]
	m.m14 = rA_[3], m.m15 = rA_[4]
	m.m21 = gA[0], m.m22 = gA[1], m.m23 = gA[2]
	m.m24 = gA[3], m.m25 = gA[4]
	m.m31 = bA[0], m.m32 = bA[1], m.m33 = bA[2]
	m.m34 = bA[3], m.m35 = bA[4]
	m.m41 = aA[0], m.m42 = aA[1], m.m43 = aA[2]
	m.m44 = aA[3], m.m45 = aA[4]
	return m
}

function matrixToDoubleArray(m) {
	if (!m) print("❌ matrixToDblArray Error: ", m, "\r", fnStack())
	return [
		[m.m11, m.m12, m.m13, m.m14, m.m15],
		[m.m21, m.m22, m.m23, m.m24, m.m25],
		[m.m31, m.m32, m.m33, m.m34, m.m35],
		[m.m41, m.m42, m.m43, m.m44, m.m45]
	]
}

function concatDoubleArrays(aa, bb, db) {
	/* Concatenate Color Matrix Double Arrays v2020-10-23a 
	aa: Variable double array (new array to concatenate)
	bb: Constant double array (old array that needs concatenation)
	
	*/
	if (!Array.isArray(aa) || !Array.isArray(bb)) print(fnStack())
	let c, AA = Array.from(Array(4), () => [])
	for (let i = 0; i < 5; i++) {
		for (let j = 0; j < 4; j++) AA[j][i] =
			aa[j][3] * bb[3][i] + aa[j][2] * bb[2][i] +
			aa[j][1] * bb[1][i] + aa[j][0] * bb[0][i]
	}
	AA[0][4] += aa[0][4], AA[1][4] += aa[1][4]
	AA[2][4] += aa[2][4], AA[3][4] += aa[3][4]
	return AA
}

function mix(a, b, aPc, thisFn) {
	/* mix function v21-10-31a 
	Mixes numbers, colors, arrays, double arrays… */
	thisFn = thisFn || globalThis.mix || globalThis.Ω.mix
	const fn = function(a, b, aPc) {
		return (a * aPc) + (b * (1 - aPc))
	}
	const typeA = Object.prototype.toString.call(a)
	const typeB = Object.prototype.toString.call(b)
		// print(mix)
	if (typeA === "[object Boolean]") a = ~~a
	if (typeB === "[object Boolean]") b = ~~a
	if (typeA === "[object Number]") return fn(a, b, aPc)
	if (typeA === "[object Color]") {
		return new Color(
			fn(a.redComponent(), b.redComponent(), aPc),
			fn(a.greenComponent(), b.greenComponent(), aPc),
			fn(a.blueComponent(), b.blueComponent(), aPc),
			fn(a.alpha(), b.alpha(), aPc)
		)
	}
	//--assume a and b are arrays
	let v = []
	for (let i = 0; i < a.length; i++) {
		v.push(mix(a[i], b[i], aPc))
	}
	return v
}

function quantizeColorMatrixDoubleArrayFn(aa, q) {
	/* Quantize Color Matrix Double Arrays v21-10-21a
	q: quantizes values, e.g., 1000 rounds to nearest 1/1000 */
	if (!q) return aa
	let c
	const Q = function(n) { return Math.round(n * q) / q }
	for (let i = 0; i < 4; i++) {
		for (let j = 0; j < 5; j++) aa[i][j] = Q(aa[i][j])
	}
	return aa
}

function zapColorMatrixDoubleArrayFn(aa, z) {
	/* Color Matrix Double Array 
	 Small Numbers To Zero v21-10-21a
	z: threshold at which values are clipped to zero,
	  e.g., .0001 */
	if (!z) return aa
	const Z = function(n) { return n < z && n > -z ? 0 : n }
	for (let i = 0; i < 4; i++) {
		for (let j = 0; j < 5; j++) aa[i][j] = Z(aa[i][j])
	}
	return aa
}

function toColorArrFn(r_, g, b, a) {
	/* To Color Array v20-08-24 
	Accepts arguments, color objects, boolean, 
	or three to four elements (for purposes of duplication).
	Returns a four element array. */
	if (r_.length) {
		if (r_[2] !== undefined) a = r_
		else a = [r_[0], r_[0], r_[0], r_[1]]
	} else if (typeof r_ === "boolean") a = [r_, r_, r_, g]
	else if (typeof r_ === "number") {
		if (typeof b === "number") a = [r_, g, b, a]
		else a = [r_, r_, r_, g]
	} else a = [
		r_.redComponent(), r_.greenComponent(),
		r_.blueComponent(), r_.alpha()
	]
	a[3] = a[3] === undefined ? 1 : a[3]
	return a
}

function mixColorArraysFn(c1, c2, c1Pc) {
	let æ = []
	if (c1 && !c1.length) c1 = colorToArr(c1)
	if (c2 && !c2.length) c2 = colorToArr(c2)
	if (c1[3] === undefined) c1[3] = 1
	if (c2[3] === undefined) c2[3] = 1
	for (let i = 0; i < 4; i++) {
		æ[i] = mix(c1[i], c2[i], c1Pc)
	}
	return æ
}

function colorToOpaqueDoubleArray(c) {
	c = toColorArrFn(c)
	return [
		[0, 0, 0, 0, c[0]],
		[0, 0, 0, 0, c[1]],
		[0, 0, 0, 0, c[2]],
		[0, 0, 0, 1, 0]
	]
}

function colorToDoubleArray(c) {
	c = toColorArrFn(c)
	return [
		[0, 0, 0, 0, c[0]],
		[0, 0, 0, 0, c[1]],
		[0, 0, 0, 0, c[2]],
		[0, 0, 0, c[3], 0]
	]
}

function newDoubleArray(aa) {
	if (aa) {
		return [
			[...aa[0]],
			[...aa[1]],
			[...aa[2]],
			[...aa[3]]
		]
	}
	return [
		[1, 0, 0, 0, 0],
		[0, 1, 0, 0, 0],
		[0, 0, 1, 0, 0],
		[0, 0, 0, 1, 0]
	]
}

function map(n, a, b, c, d) {
	b = b - a || Number.EPSILON
	return c + ((d - c) * ((n - a) / b))
}

function clamp(n, a, b) {
	if (a > b)[a, b] = [b, a]
	return Math.min(Math.max(a, n), b)
}

function mix(a, b, aPc) {
	const fn = function(a, b, aPc) {
		return (a * aPc) + (b * (1 - aPc))
	}
	if (typeof a === "number") return fn(a, b, aPc)
	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) {
			print("mix error");
			return
		}
		if (Array.isArray(a[0]) && Array.isArray(b[0])) {
			if (a[0].length !== b[0].length) {
				print("mix error");
				return
			}
		} else {
			for (let i = 0, len = a.length; i < len; i++) {
				a[i] = fn(a[i], b[i], aPc)
			}
			return a
		}
	}
}

G.____________INSPECTORS = _ => _

var _inspectors = []
var _curveBackgroundImage
var _channelBackgroundContext
var _spectrumChannelsBackgroundContext
var _ChannelMixBackgroundContext

G.________RUN_INSPECTORS = _ => _

function set_printPsdMixer(a) {
	if (!a) return

	const fn = function(n) {
		n = Math.round(n * 100)
		if (n > 200 || n < -200) {
			return n + " % INCOMPATIBLE!"
		} else return n + " %"
	}
	let s = "\r===PHOTOSHOP—CHANNEL—MIXER==="
	s += "\r\r————RED—CHANNEL—POPUP—⌥3————\r"
	s += "\r🟥 Red:   \t" + fn(_aa[0][0])
	s += "\r🟩 Green:\t" + fn(_aa[0][1])
	s += "\r🟦 Blue:  \t" + fn(_aa[0][2])
	s += "\r⬛️ Const:\t" + fn(_aa[0][4])
	s += "\r\r————GREEN—CHANNEL—POPUP—⌥4————\r"
	s += "\r🟥 Red:   \t" + fn(_aa[1][0])
	s += "\r🟩 Green:\t" + fn(_aa[1][1])
	s += "\r🟦 Blue:  \t" + fn(_aa[1][2])
	s += "\r⬛️ Const:\t" + fn(_aa[1][4])
	s += "\r\r————BLUE—CHANNEL—POPUP—⌥5————\r"
	s += "\r🟥 Red:   \t" + fn(_aa[2][0])
	s += "\r🟩 Green:\t" + fn(_aa[2][1])
	s += "\r🟦 Blue:  \t" + fn(_aa[2][2])
	s += "\r⬛️ Const:\t" + fn(_aa[2][4])
	s += "\r\r============================"
	print(s)
}

function setInspectorOnLayer(l, o) {
	Transaction.disableActions = true
	l.setValueForKeyPath(o, "contents")
}

function runInspector(aa) {
	_inspectors = []
	_previewConfiguration = _previewConfiguration || []
	let a = _previewConfiguration
	for (let i = 0, o, l, len = a.length; i < len; i++) {
		if (a[i] === "RGB Curves") {
			o = returnCurvePreview(aa)
			_inspectors.push(o)
			l = _previewToLayer[i]
			if (l) setInspectorOnLayer(_previewToLayer[i], o)
		}
		//--
		else if (a[i] === "RGB Curve Overlay") {
			// _inspectors.push(returnCurvePreview(aa))
		}
		//--
		else if (a[i] === "RGB Channels") {
			o = returnChannelPreview(aa)
			_inspectors.push(o)
			l = _previewToLayer[i]
			if (l) setInspectorOnLayer(_previewToLayer[i], o)
		}
		//--
		else if (a[i] === "RGB Channel Mix") {
			_inspectors.push(returnChannelMixPreview(aa))
		}
		//--
		else if (a[i] === "Spectrum Channels") {
			o = returnSpectrumChannelsPreview(aa)
			_inspectors.push(o)
			l = _previewToLayer[i]
			if (l) setInspectorOnLayer(_previewToLayer[i], o)
		}
		//--
		else if (a[i] === "Spectrum To 0.00") {
			o = returnFullSpectrumPreview(aa, 0)
			_inspectors.push(o)
			l = _previewToLayer[i]
			if (l) setInspectorOnLayer(_previewToLayer[i], o)
		} else if (a[i] === "Spectrum To 0.25") {
			o = returnFullSpectrumPreview(aa, .25)
			_inspectors.push(o)
			l = _previewToLayer[i]
			if (l) setInspectorOnLayer(_previewToLayer[i], o)
		} else if (a[i] === "Spectrum To 0.50") {
			o = returnFullSpectrumPreview(aa, .5)
			_inspectors.push(o)
			l = _previewToLayer[i]
			if (l) setInspectorOnLayer(_previewToLayer[i], o)
		} else if (a[i] === "Spectrum To 0.75") {
			o = returnFullSpectrumPreview(aa, .75)
			_inspectors.push(o)
			l = _previewToLayer[i]
			if (l) setInspectorOnLayer(_previewToLayer[i], o)
		} else if (a[i] === "Spectrum To 1.00") {
			o = returnFullSpectrumPreview(aa, 1)
			_inspectors.push(o)
			l = _previewToLayer[i]
			if (l) setInspectorOnLayer(_previewToLayer[i], o)
		} else if (a[i] === "RGB Channel Mix") {
			o = returnFullSpectrumPreview(aa, 1)
			_inspectors.push(o)
			l = _previewToLayer[i]
			if (l) setInspectorOnLayer(_previewToLayer[i], o)
		}
		//--
		else if (a[i] === "YCC Curve") {}
		//--
		else if (a[i] === "YCC Channel") {}
		//--
		else if (a[i] === "YCC Channel Mix") {}

	}
	instance.valueChanged("_inspectors")

	//--check for photoshop channel mixer compatibility
	_psdOk = 1
		// _psdOk = 1
	for (let i = 0, a = [0, 0, 0, 1, 0], n; i < 3; i++) {
		n = 0
		for (let j = 0; j < 5; j++) {
			if (_aa[i][j] > 2 || _aa[i][j] < -2) {
				_psdOk = 0;
				break
			}
		}
	}
	for (let i = 0, a = [0, 0, 0, 1, 0], n; i < 5; i++) {
		if (_aa[3][i] !== a[i]) { _psdOk = 0; break }
	}
	for (let i = 0, n; i < 3; i++) {
		if (_aa[i][3]) {
			_psdOk = 0;
			break
		}
	}
	instance.valueChanged("_psdOk")

}

function returnCurvePreview(aa) {
	let o = new Context(256, 256, true)
	o.drawImage(0, 0, 256, 256, _curveBackgroundImage)

	//--draw lines
	o.compositeOperation = "screen"
	for (let f, n = 0, i = 0; n <= 256; n += 2) {
		f = n / 256
		let cA = [f, f, f]
		cA = transformClampedColorArray(cA, aa)

		//--red line
		o.setFillColor(new Color(1, 0, 0, 1))
		o.fillRect(n - 3, cA[0] * 256 - 2, 4, 4)

		//--green line
		o.setFillColor(new Color(0, 1, 0, 1))
		o.fillRect(n - 3, cA[1] * 256 - 2, 4, 4)

		//--blue line
		o.setFillColor(new Color(0, .5, 1, 1))
		o.fillRect(n - 3, cA[2] * 256 - 2, 4, 4)

	}
	return o.image()
}

function returnChannelMixPreview(aa) {
	let o = new Context(256, 176, true)
	o.compositeOperation = "source-over"
	let a = [
		new Color(.2, 0, 0),
		new Color(0, .2, 0),
		new Color(0, .1, .2),
		new Color(.2, .2, .2),
	]
	for (let i = 0; i < 4; i++) {
		o.setFillColor(a[i])
		o.fillRect(i * 64, 0, 64, 176)
	}
	o.setFillColor(new Color(0, 0, 0, .3))
	o.fillRect(0, 0, 256, 88)
	o.setFillColor(new Color(1, 1, 1, .1))
	o.fillRect(0, 152, 256, 24)
	o.fillRect(0, 0, 256, 24)
	o.compositeOperation = "screen"
	a = [
		[new Color(1, 0, 0), 16],
		[new Color(0, 1, 0), 16],
		[new Color(0, .5, 1), 16],
		[new Color(.3, .3, .3), 16],
		[new Color(.3, .3, .3), 12],
	]
	for (let i = 0, x1; i < 4; i++) {
		x1 = i * 64
		o.compositeOperation = "screen"
		for (let j = 0, x2; j < 5; j++) {
			x2 = (j + 1) * 12 - 10
			o.setFillColor(a[j][0])
			o.fillRect(x1 + x2, 88, a[j][1], aa[i][j] * 64)
		}
	}
	return o.image()
}

function returnChannelPreview(aa) {
	let o = _channelBackgroundContext
	o.compositeOperation = "source-over"
	for (let f, i = 0, c; i < 256; i++) {
		let cA = [i / 255, i / 255, i / 255, 1]
		cA = transformClampedColorArray(cA, aa)
		o.setFillColor(new Color(cA[0], cA[1], cA[2]))
		o.fillRect(i + 6, 204, 1, 40)
		o.setFillColor(new Color(cA[0], cA[0], cA[0]))
		o.fillRect(i + 6, 140, 1, 40)
		o.setFillColor(new Color(cA[1], cA[1], cA[1]))
		o.fillRect(i + 6, 76, 1, 40)
		o.setFillColor(new Color(cA[2], cA[2], cA[2]))
		o.fillRect(i + 6, 12, 1, 40)
	}
	return o.image()
}

function returnSpectrumChannelsPreview(aa) {
	let o = _spectrumChannelsBackgroundContext
	o.compositeOperation = "source-over"
	let a = _spectrumColors
	for (let i = 0; i < 360; i++) {
		let cA = [a[i][0], a[i][1], a[i][2], 1]
		cA = transformClampedColorArray(cA, aa)
		o.setFillColor(new Color(cA[0], cA[1], cA[2]))
		o.fillRect(i + 6, 194 + 10, 1, 40)
		o.setFillColor(new Color(cA[0], cA[0], cA[0]))
		o.fillRect(i + 6, 130 + 10, 1, 40)
		o.setFillColor(new Color(cA[1], cA[1], cA[1]))
		o.fillRect(i + 6, 66 + 10, 1, 40)
		o.setFillColor(new Color(cA[2], cA[2], cA[2]))
		o.fillRect(i + 6, 2 + 10, 1, 40)
	}
	return o.image()
}

function returnFullSpectrumPreview(aa, k) {
	let a, o = new Context(368, 256, true)
	a = _spectrumColors

	o.compositeOperation = "source-over"

	for (let i = 0, n; i < 272; i += 8) {
		n = i / 256
			// n = 
		for (let j = 0, cA, r, g, b; j < 361; j += 8) {
			r = map(n, 0, 1, k, a[j][0])
			g = map(n, 0, 1, k, a[j][1])
			b = map(n, 0, 1, k, a[j][2])

			cA = [r, g, b, 1]
			cA = transformClampedColorArray(cA, aa)
			o.setFillColor(new Color(cA[0], cA[1], cA[2]))
			o.fillRect(j, i - 4, 8, 8)
		}
	}
	return o.image()
}

G.________BUILD_INSPECTORS = _ => _

var _spectrumColors = []
for (let i = 0; i < 60; i++) {
	_spectrumColors.push([1, i / 60, 0])
}
for (let i = 0; i < 60; i++) {
	_spectrumColors.push([1 - i / 60, 1, 0])
}
for (let i = 0; i < 60; i++) {
	_spectrumColors.push([0, 1, i / 60])
}
for (let i = 0; i < 60; i++) {
	_spectrumColors.push([0, 1 - i / 60, 1])
}
for (let i = 0; i < 60; i++) {
	_spectrumColors.push([i / 60, 0, 1])
}
for (let i = 0; i < 60; i++) {
	_spectrumColors.push([1, 0, 1 - i / 60])
}
_spectrumColors.push([1, 0, 0])

function buildInspectorBackgrounds() {
	//--function should be run in init

	buildChannelBackgroundContext()
	buildCurveBackgroundContext()
	buildSpectrumChannelsBackgroundContext()
	buildChannelsMixContext()
}

function buildCurveBackgroundContext() {

	//--create curve image
	let o = new Context(256, 256, true)
	o.compositeOperation = "screen"
	o.setFillColor(new Color(0, 0, 0))
	o.fillRect(0, 0, 256, 256)
	o.setFillColor(new Color(1, 1, 1, .5))

	//--graph horizontal quarters
	o.setFillColor(new Color(1, 1, 1, .125))
	o.fillRect(-1, 62, 256, 4)
	o.fillRect(-1, 126, 256, 4)
	o.fillRect(-1, 190, 256, 4)

	//--graph horizontal quarters
	o.setFillColor(new Color(1, 1, 1, .125))
	o.fillRect(62, 0, 4, 256)
	o.fillRect(126, 0, 4, 256)
	o.fillRect(190, 0, 4, 256)

	//--dotted line
	for (let f, n = 0, i = 0; n <= 256; n += 2) {
		if (i++ % 4 === 0) {
			o.setFillColor(new Color(1, 1, 1, .125))
			o.fillRect(n - 2, n - 2, 4, 4)
		}
	}
	_curveBackgroundImage = o.image()
}

function buildChannelBackgroundContext() {
	let o = new Context(268, 256, true)
	o.compositeOperation = "source-over"

	//--background color
	o.setFillColor(new Color(.5, .5, .5))
	o.fillRect(0, 0, 268, 256)

	//--red patches
	o.setFillColor(new Color(1, 0, 0))
	o.fillRect(0, 128 + 2, 268, 60)

	//--green patches
	o.setFillColor(new Color(0, 1, 0))
	o.fillRect(0, 66, 268, 60)

	//--blue patches
	o.setFillColor(new Color(0, .5, 1))
	o.fillRect(0, 2, 268, 60)

	//--gradient
	for (let i = 0, f; i < 256; i++) {
		f = i / 255
		o.setFillColor(new Color(f, f, f))
		o.fillRect(i + 6, 0, 1, 256)
	}
	//--dividers
	o.setFillColor(new Color(.25, .25, .25))
	for (let i = 1; i < 5; i++) o.fillRect(0, i * 64 - 2, 268, 2)
	o.setFillColor(new Color(.75, .75, .75))
	for (let i = 0; i < 4; i++) o.fillRect(0, i * 64, 268, 2)

	_channelBackgroundContext = o
}

function buildSpectrumChannelsBackgroundContext() {
	let a, o = new Context(372, 256, true)
	a = _spectrumColors

	//--channels
	o.compositeOperation = "source-over"
	for (let i = 0; i < a.length; i++) {
		o.setFillColor(new Color(a[i][0], a[i][1], a[i][2]))
		o.fillRect(i + 6, 194, 1, 60)
		o.setFillColor(new Color(a[i][0], a[i][0], a[i][0]))
		o.fillRect(i + 6, 130, 1, 60)
		o.setFillColor(new Color(a[i][1], a[i][1], a[i][1]))
		o.fillRect(i + 6, 66, 1, 60)
		o.setFillColor(new Color(a[i][2], a[i][2], a[i][2]))
		o.fillRect(i + 6, 2, 1, 60)
	}
	//--dividers
	o.setFillColor(new Color(.25, .25, .25))
	for (let i = 1; i < 5; i++) o.fillRect(0, i * 64 - 2, 372, 2)
	o.setFillColor(new Color(.75, .75, .75))
	for (let i = 0; i < 4; i++) o.fillRect(0, i * 64, 372, 2)

	//--indicators
	o.setFillColor(new Color(.5, .5, .5))
	o.fillRect(0, 194, 6, 60), o.fillRect(366, 194, 6, 60)
	o.setFillColor(new Color(1, 0, 0))
	o.fillRect(0, 130, 6, 60), o.fillRect(366, 130, 6, 60)
	o.setFillColor(new Color(0, 1, 0))
	o.fillRect(0, 66, 6, 60), o.fillRect(366, 66, 6, 60)
	o.setFillColor(new Color(0, .5, 1))
	o.fillRect(0, 2, 6, 60), o.fillRect(366, 2, 6, 60)

	_spectrumChannelsBackgroundContext = o
}

function buildChannelsMixContext() {
	/*	
	256x176
	64x64 spures
		
		
		
		
	*/
	let a, o = new Context(250, 102, true)
	_ChannelMixBackgroundContext = o
	for (let i = 0; i < 1; i++) {
		for (let j = 0; j < 36; j++) {
			// print(j % 18)
		}

	}
}

function transformClampedColorArray(cA, aa, min, max) {
	/* Transform Color Array Using 5x4 Color Matrix v21-10-25a 
	for iOS, use min:-.75 and max:1.25 */

	const dotProduct = function(a, b) {
		return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]
	}
	const clamp = function(n, min, max) {
		return Math.min(Math.max(min, n), max)
	}
	let a = [0, 0, 0, 0]
	min = min || 0, max = max || 1

	//--merge alpha into color array
	cA = cA.slice(0)

	if (cA[3] == null) cA[3] = 1
	else cA[0] /= cA[3], cA[1] /= cA[3], cA[2] /= cA[3]

	//--process colors
	for (let i = 0; i < 4; i++) {
		a[i] = dotProduct(cA, aa[i]) + aa[i][4]
	}
	//--multiply alpha and clamp
	a[0] = clamp(a[0] * a[3], min, max)
	a[1] = clamp(a[1] * a[3], min, max)
	a[2] = clamp(a[2] * a[3], min, max)
	a[3] = clamp(a[3], 0, 1)

	//--blend output with dest as filtering ends up non opaque
	a[0] += cA[0] * (1.0 - a[3])
	a[1] += cA[1] * (1.0 - a[3])
	a[2] += cA[2] * (1.0 - a[3])
	a[3] += cA[3] * (1.0 - a[3])

	return a
}

G.____________TEMPLATES = _ => _

if (____________FLOYDIAN_COMPONENT_GLOBAL_TEMPLATE_v21_10_13a => _) {
	globalThis.G = globalThis
	G.globalPathDoc = function globalPathDoc() {
		print(this)
			/* Component Global Callback Path Field v21-10-07a 
			Used to update a component text field with copy/paste 
			code blocks that users can insert into their scripts 
			These code blocks load the component's global object 
			into the script's global scope.
			  -Place this code block into component js global scope.
			  -Place this code into component caml file:
			    <LKPropertyItem
			      title="Global Object Path" 
			      key="_globalPath"
			      type_id="string"
			      commitOnReturn="true"
			    />
			*/
	};
	G._globalPath = ""
	G.set_globalPath = function set_globalPath() {
		let n = instance.name
		let pattern = "[^abcdefghijklmnopqrstuvwxyz1234567890]"
		let regex = new RegExp(pattern, "ig")
		if (!isNaN(n[0])) n = "_" + n
		n = n.replace(new RegExp(regex), "_")
		_globalPath = "globalThis." + n +
			" = \r\tfindLayer('" + layer.name +
			"').valueForKeyPath(\r\t\t'scriptComponents." +
			instance.name + ".globalThis')\r"
		instance.valueChanged("_globalPath")
	}
}

if (____________FLOYDIAN_EVAL_TEMPLATE_v21_04_02a => _) {
	globalThis.G = globalThis
	G.evalDoc = function evalDoc() {
		const r =
			print(this)

		/* Add custom code to the global scope. All code will run 
		before the init function runs. Use enter key (option+return) 
		to create new lines. Use the 'Run Again' button or return 
		key to manually run, (the return key only runs if code 
		contains changes). 
		
		USABLE VARIABLE EXAMPLES
		G: Shorcut to globalThis
		_out: Current Output
		_lastOut: Last Output
		
		USABLE FUNCTION EXAMPLES
		function evalInit(){print("runs on init only")}
		function evalPreOut(){print("runs before outputs is sent")}
		function evalPostOut(){print("runs after outputs is sent")}
		function layoutSublayers(){print("layer size: ",layer.size)}
		
		WARNING: DECLARATIONS
		Declaring variables and functions into the 
		global scope are persistent. If you remove them 
		from the Customize Code Eval UI field, they 
		will still exist until the document is closed 
		or the script is re-saved via a text editor. If 
		you need to remove something, set it to null, 
		e.g., this.evalInit = null
		
		WARNING: FIELD FOCUS
		If you make a change, then click on the Run button 
		without defocusing the text field, the changes will 
		not be included. The field is still in edit mode. 
		
		WARNING: UNDO/REDO
		Be aware that using undo/redo on changes in the 
		Customize Code Eval UI field triggers code execution. 
		*/
	};
	G._eval = G._eval || "// evalDoc()"
		//--custom eval UI declarations and setters
		//--(omitting 'ready' flag triggers execution BEFORE init)
	var _runEval
	G.set_eval = function(a) {
		_eval = a, _eval && (1, eval)(_eval)
	}
	G.set_runEval = function(a) {
		_runEval = a, a && _eval && (1, eval)(_eval)
	}
}

G.____________DEBUGGING = _ => _

function fnStack() {
	/* Function Stack v2020-02-28a
	Similar to 'arguments.callee.caller.toString()', but will 
	return entire stack with script names. Works in 'strict mode'. 
	You can add arguments to be printed at the end of the stack. */
	try { throw new Error() } catch (e) {
		const stackArray = e.stack.split("@")
		let scriptName, fnName
		let t = currentTime() % 100
		t = (t < 10 ? "0" : "") + t.toFixed(3)
		let s = "————F—U—N—C—T—I—O—N———S—T—A—C—K————: " + t + "\r"
		for (let i = stackArray.length - 2, a; i >= 1; i--) {
			a = stackArray[i].split("/").pop()
			scriptName = a.split(".")[0]
			fnName = a.split("\n").pop() + "()"
			if (scriptName) {
				s += scriptName + ".js" + "【 " + fnName + " 】\r"
			}
		}
		if (arguments.length) {
			s += "…("
			for (let i = 0; i < arguments.length; i++) {
				s += (i === 0 ? "" : ", ") + arguments[i]
			}
			s += ") {…"
		}
		s += "\n———————————————————————————————————\n"
		return s
	}
}

function propList(o, noVal, proto, noSort, noCarRet) {
	/* Return List Of All Properties On Object v2019-10-25a 
	Und,Nul,Boo,Num,Str,Arr,Obj,NSA,NSD */
	const typOf = (a) => {
		a = Object.prototype.toString.call(a)
		if (a.charAt(10) !== "M") return a.slice(8, 11)
		return "NM" + a.slice(17, 18)
	}
	let s = ""
	let t = typOf(o)
	if (typeof o === "object") {
		s += "\n----PROPERTY LIST----> ⦗" + t + "⦘ " + o
		let prps, æ = []
		if (proto) prps = Object.keys(o)
		else prps = Object.getOwnPropertyNames(o)
		if (!noSort) prps.sort()
		if (!noCarRet) {
			for (let i = 0, z, p; i < prps.length; i++) {
				p = prps[i]

				//--get property types
				if (p === "typeInfo") t = "!!!"
				else if (p === "debugDescription") t = "!!!"
				else if (p === "delegate") t = "!!!"
				else if (p === "observationInfo") t = "!!!"
				else if (p === "unsafeUnretainedDelegate") {
					t = "!!!"
				} else t = typOf(o[p])
				z = i < 10 ? "\n00" : i < 100 ? "\n0" : "\n"
				æ.push(z + i + " ⦗" + (t) + "⦘ " + p + " = ")

				//--get values
				if (p === "debugDescription") continue
				else if (!noVal) æ.push(o[p])
			}
			æ.push("\n")
		}
		s += æ.toString()
	} else {
		s += "\n----LIST----> ⦗" + t + "⦘ " + o
	}
	return s
}

function stringify(o, nsDictInclusionMode, spacing) {
	/* NS Compatible Json Stringify v2021-02-12b? 
	nsDictInclusionMode: Includes NSDictionary keys and values
	(avoids crashes by converting ns values to strings)
	spacing: Stringify Indentation (2 is used if omitted)*/
	let f = function(k, v) {
		let b, a = []
		let t = Object.prototype.toString.call(v)
		let s = "[object "

		//--standard object types
		if (t === s + "Object]") return v
		else if (t === s + "String]") return v
		else if (t === s + "Undefined]") return "❲undefined❳"
		else if (t === s + "Null]") return "❲null❳"
		else if (t === s + "Array]") return v
		else if (t === s + "Map]") return v
		else if (t === s + "Set]") return v
		else if (t === s + "WeakMap]") return v
		else if (t === s + "WeakSet]") return v
		else if (t === s + "Math]") return v
		else if (t === s + "Boolean]") return v
		else if (t === s + "Arguments]") return v
		else if (t === s + "Function]") return v
		else if (t === s + "Error]") return v
		else if (t === s + "RegExp]") return v
		else if (t === s + "JSON]") return v
		else if (t === s + "GeneratorFunction]") return v
		else if (t === s + "Generator]") return v
		else if (t === s + "Proxy]") return v
		else if (t === s + "Promise]") return v

		//--number types    
		else if (v === Math.PI) return "π⃞"
		else if (v === Number.EPSILON) return "❲EPSILON❳"
		else if (v === Number.MAX_SAFE_INTEGER) {
			return "❲MAX_SAFE_I❳"
		} else if (v === Number.MAX_VALUE) {
			return "❲MAX_VAL❳"
		} else if (v === Number.MIN_SAFE_INTEGER) {
			return "❲MIN_SAFE_I❳"
		} else if (v === Number.MIN_VALUE) {
			return "❲MIN_VAL❳"
		} else if (t === "[object Number]" && isFinite(v)) {
			return v
		} else if (v == Number.POSITIVE_INFINITY) {
			return '❲∞❳'
		} else if (v == Number.NEGATIVE_INFINITY) {
			return '❲-∞❳'
		}

		//--ns arrays
		else if (t === "[object NSArray]" ||
			t === "[object NSMutableArray]") {
			for (let i = 0; i < v.length; i++) a.push(v[i])
			return a
		}

		//--ns dictionaries
		else if (nsDictInclusionMode === 1) {
			if (typeof v && v.description) {
				let k1 = Object.keys(v)
				let o1 = {}
				for (let i = 0; i < k1.length; i++) {
					o1[k1[i]] = "❲" + v[k1[i]] + "❳"
				}
				return o1
			}
		} else if (nsDictInclusionMode === 2) {
			if (t === "[object NSDictionary]" ||
				t === "[object NSMutableDictionary]") {
				b = nsDictInclusionMode && typeof v
				if (b && v.description) {
					let k1 = Object.keys(v)
					let o1 = {}
					for (let i = 0; i < k1.length; i++) {
						o1[k1[i]] = "❲" + v[k1[i]] + "❳"
					}
					return o1
				} else return v
			}
		}
		//--use layer names if layers
		else if (t.endsWith("Layer]")) {
			t = t.split("[object ")[1]
			t = t.split("]")[0]
			return "❲" + t + "('" + v.name + "')❳"
		}
		//--misc object types
		else {
			return "❲" + v.toString() + "❳"
		}

	}
	if (spacing == null) spacing = 2
	return JSON.stringify(o, f, spacing)
}

function doubleArrayToString(aa, fix) {
	fix = fix || 4
	let s = "————————————————————————————————\r[\r"
	for (let i = 0; i < 4; i++) {
		s += "\t[ "
		for (let j = 0; j < 4; j++) {
			s += aa[i][j].toFixed(fix) + ", "
		}
		s += aa[i][4].toFixed(fix) + " ]\r"
	}
	return s + "]"
}