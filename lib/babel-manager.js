const pkg = require('../package.json');

module.exports = ({experiments, projectDir}) => {
	const ava = {version: pkg.version};

	if (experiments.noBabelOutOfTheBox) {
		let fatal;
		const provider = require('./babel')({
			negotiateProtocol(identifiers) {
				if (!identifiers.includes('noBabelOutOfTheBox')) {
					fatal = new Error('TODO: Throw error when @ava/babel does not negotiate the expected protocol');
					return null;
				}

				return {identifier: 'noBabelOutOfTheBox', ava, projectDir};
			}
		});

		if (fatal) {
			throw fatal;
		}

		return {
			legacy: false,
			...provider,
			// Don't pass the legacy compileEnhancements value.
			validateConfig: babelConfig => provider.validateConfig(babelConfig)
		};
	}

	let fatal;
	const negotiateProtocol = identifiers => {
		if (!identifiers.includes('legacy')) {
			fatal = new Error('TODO: Throw error when @ava/babel does not negotiate the expected protocol');
			return null;
		}

		return {identifier: 'legacy', ava, projectDir};
	};

	const [full, enhancementsOnly] = [require('./babel')({negotiateProtocol}), require('./babel')({negotiateProtocol})];

	if (fatal) {
		throw fatal;
	}

	return {
		legacy: true,
		...full,
		validateConfig(babelConfig, compileEnhancements) {
			full.validateConfig(babelConfig, compileEnhancements, false);
			enhancementsOnly.validateConfig(false, compileEnhancements, true);
		},
		get compileEnhancements() {
			if (enhancementsOnly.isEnabled()) {
				return enhancementsOnly.compile;
			}

			return null;
		}
	};
};
