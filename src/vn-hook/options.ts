import defaultConfig, {Config} from '../defaultConfig';

let config: Config = defaultConfig;

const configMapFunctions = {
    makeAnkiFields: (values, fromConfig) => {
        if (fromConfig === true) {
            const string = [];
            for (const key in values) {
                string.push(`${key} = ${values[key]}`);
            }

            return string.join('; ');
        } else {
            values = values.split(';');

            const fields = {};
            for (let value of values) {
                if (value.trim() === '') continue;

                value = value.split('=');

                if (value.length !== 2) continue;

                fields[value[0].trim()] = value[1].trim();
            }

            return fields;
        }
    },
    mapEpwingPathToDictionaries: (values, fromConfig) => {
        const $epwingError = $("#epwing-dictionary-path-error");
        if ($epwingError.text() === '') {
            $epwingError.hide();
        }
        if (fromConfig) {
            if (values.length) {
                return values[0].path;
            }

            return '';
        } else {
            if (values.startsWith("~") || values.startsWith(".")) {
                $epwingError.text("Please use an absolute path. Relative paths don't work").show();

                return [];
            }

            if (values.endsWith('CATALOGS')) {
                values = values.slice(0, -9);
            }

            $epwingError.text('').hide();

            if (values.length) {
                return [{name: '', path: values}];
            }

            return [];
        }
    },
    makeInt: (value) => parseInt(value),
};

function setFormFieldsFromConfig(config: Config) {
    $('[data-config-option]:checkbox').each((_, checkbox) => {
        const $checkbox = $(checkbox);
        $checkbox.prop('checked', config[$checkbox.data('config-option')]);
    });

    $('select[data-config-option]').each((_, select) => {
        const $select = $(select);
        $select.val(config[$select.data('config-option')]);
    });

    $('[data-config-option]:text, [data-config-option][type=number]').each((_, input) => {
        const $input = $(input);
        let configValue = config[$input.data('config-option')];
        if ($input.data('config-map')) {
            const map = $input.data('config-map');
            if (typeof configMapFunctions[map] === 'function') {
                configValue = configMapFunctions[map](configValue, true);
            }
        }

        $input.val(configValue);
    });
}

const registerInputListeners = () => {
    $('[data-config-option][type=number]').on('blur', event => {
        const $element = $(event.target);

        // @ts-ignore
        let configValue = parseInt($element.val());
        if (isNaN(configValue)) configValue = 0;
        // @ts-ignore
        if ($element.attr('min') && configValue < $element.attr('min')) configValue = $element.attr('min');
        // @ts-ignore
        if ($element.attr('max') && configValue > $element.attr('max')) configValue = $element.attr('max');

        if ($element.data('config-map') && typeof configMapFunctions[$element.data('config-map')] === 'function') {
            configValue = configMapFunctions[$element.data('config-map')](configValue, false);
        }

        config[$element.data('config-option')] = configValue;
        // @ts-ignore
        browser.storage.sync.set({config});
        setFormFieldsFromConfig(config)
    });

    $('[data-config-option]:text').on('blur', event => {
        const $element = $(event.target);

        let configValue = $element.val();

        if ($element.data('config-map') && typeof configMapFunctions[$element.data('config-map')] === 'function') {
            configValue = configMapFunctions[$element.data('config-map')](configValue, false);
        }

        config[$element.data('config-option')] = configValue;
        // @ts-ignore
        browser.storage.sync.set({config});
        setFormFieldsFromConfig(config)
    });

    $('[data-config-option]:checkbox').on('change', event => {
        const $element = $(event.target);

        config[$element.data('config-option')] = $element.is(':checked');
        // @ts-ignore
        browser.storage.sync.set({ config });
        setFormFieldsFromConfig(config);
    });

    $('select[data-config-option]').on('change', event => {
        const $element = $(event.target);

        config[$element.data('config-option')] = $element.val();
        // @ts-ignore
        browser.storage.sync.set({ config });
        setFormFieldsFromConfig(config);
    });
}

export default () => {
    // @ts-ignore
    $('[title]').tooltip({});

    registerInputListeners();

    browser.storage.sync.get('config').then(({ config: extensionConfig }: { config?: Config }) => {
        if (typeof extensionConfig === 'undefined') { extensionConfig = config; // @ts-ignore
            // @ts-ignore
            browser.storage.sync.set({ config }); }

        config = extensionConfig;

        setFormFieldsFromConfig(config);
    });
}
