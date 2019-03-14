import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { List, Map } from 'immutable';
import { castArray } from 'lodash';
import Select from 'react-select/lib/Async';
import styles from './styles';
import * as defaultParams from './defaultParams';

const toJS = object => {
  if (object && typeof object.toJS === 'function') return object.toJS();
  return object;
};

const defaultProps = { queryHits: Map(), field: Map() };
const propTypes = {
  onChange: PropTypes.func.isRequired,
  forID: PropTypes.string.isRequired,
  queryHits: ImmutablePropTypes.map.isRequired,
  value: PropTypes.oneOfType([ImmutablePropTypes.list.isRequired, PropTypes.string]),
  field: ImmutablePropTypes.map.isRequired,
  classNameWrapper: PropTypes.string.isRequired,
  query: PropTypes.func.isRequired,
  setActiveStyle: PropTypes.func.isRequired,
  setInactiveStyle: PropTypes.func.isRequired,
};

const createControl = (customParams = {}) => {
  const params = { ...defaultParams, ...customParams };
  const { entryMapper, getSlug, getOptionValue } = params;
  const components = { ...defaultParams.components, ...customParams.components };

  return class CustomRelationControl extends React.Component {
    static defaultProps = defaultProps;
    static propTypes = propTypes;
    static displayName = params.displayName || 'CustomRelationControl';

    getConfig = () => ({
      required: this.props.field.get('required', true),
      multiple: this.props.field.get('multiple', false),
      collection: params.collection || this.props.field.get('collection'),
      searchFields: toJS(params.searchFields || this.props.field.get('searchFields', ['title'])),
    });

    handleChange = value =>
      this.props.onChange(Array.isArray(value) ? List(value.map(getSlug)) : getSlug(value));

    loadOptions = async term => {
      const { query, forID } = this.props;
      const { collection, searchFields } = this.getConfig();
      const { hits } = await query(forID, collection, searchFields, term);
      return (hits || []).map(entryMapper);
    };

    formatOptionLabel = (value, { context }) => {
      if (context === 'menu') return value;
      if (typeof value === 'string')
        return {
          slug: value,
          collection: this.getConfig().collection,
        };
      return { entry: value };
    };

    shouldComponentUpdate() {
      return true;
    }

    render() {
      const { value, forID, classNameWrapper } = this.props;
      const { setActiveStyle, setInactiveStyle } = this.props;
      const { multiple, required } = this.getConfig();
      const isClearable = multiple || !required;
      const defaultValue = castArray(toJS(value));

      return (
        <Select
          inputId={forID}
          className={classNameWrapper}
          isMulti={multiple}
          defaultValue={defaultValue}
          onChange={this.handleChange}
          openMenuOnClick={false}
          isClearable={isClearable}
          components={components}
          styles={styles}
          cacheOptions={forID}
          onFocus={setActiveStyle}
          onBlur={setInactiveStyle}
          formatOptionLabel={this.formatOptionLabel}
          getOptionValue={getOptionValue}
          loadOptions={this.loadOptions}
          menuPlacement="bottom"
        />
      );
    }
  };
};

export default createControl;
