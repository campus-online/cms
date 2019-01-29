import { URL } from 'url';
import yaml from 'js-yaml';
import moment from 'moment';
import { sortKeys } from './helpers';

function AssetProxy(value, fileObj, uploaded = false, asset) {
  const config = store.getState().config;
  this.value = value;
  this.fileObj = fileObj;
  this.uploaded = uploaded;
  this.sha = null;
  this.path =
    config.get('media_folder') && !uploaded
      ? resolvePath(value, config.get('media_folder'))
      : value;
  this.public_path = !uploaded ? resolvePath(value, config.get('public_folder')) : value;
  this.asset = asset;
};

AssetProxy.prototype.toString = function() {
  // Use the deployed image path if we do not have a locally cached copy.
  if (this.uploaded && !this.fileObj) return this.public_path;
  try {
    return URL.createObjectURL(this.fileObj);
  } catch (error) {
    return null;
  }
};

AssetProxy.prototype.toBase64 = function() {
  return new Promise(resolve => {
    const fr = new FileReader();
    fr.onload = readerEvt => {
      const binaryString = readerEvt.target.result;

      resolve(binaryString.split('base64,')[1]);
    };
    fr.readAsDataURL(this.fileObj);
  });
};

const MomentType = new yaml.Type('date', {
  kind: 'scalar',
  predicate(value) {
    return moment.isMoment(value);
  },
  represent(value) {
    return value.format(value._f);
  },
  resolve(value) {
    return moment.isMoment(value) && value._f;
  },
});

const ImageType = new yaml.Type('image', {
  kind: 'scalar',
  instanceOf: AssetProxy,
  represent(value) {
    return `${value.path}`;
  },
  resolve(value) {
    if (value === null) return false;
    if (value instanceof AssetProxy) return true;
    return false;
  },
});

const OutputSchema = new yaml.Schema({
  include: yaml.DEFAULT_SAFE_SCHEMA.include,
  implicit: [MomentType, ImageType].concat(yaml.DEFAULT_SAFE_SCHEMA.implicit),
  explicit: yaml.DEFAULT_SAFE_SCHEMA.explicit,
});

export default {
  fromFile(content) {
    return yaml.safeLoad(content);
  },

  toFile(data, sortedKeys = []) {
    return yaml.safeDump(data, { schema: OutputSchema, sortKeys: sortKeys(sortedKeys) });
  },
};
