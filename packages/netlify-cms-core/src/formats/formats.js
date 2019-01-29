import { List } from 'immutable';
import { get } from 'lodash';
import yamlFormatter from './yaml';
import { FrontmatterInfer, frontmatterYAML } from './frontmatter';

export const frontmatterFormats = ['yaml-frontmatter'];

export const formatExtensions = {
  yml: 'yml',
  yaml: 'yml',
  frontmatter: 'md',
  'yaml-frontmatter': 'md',
};

export const extensionFormatters = {
  yml: yamlFormatter,
  yaml: yamlFormatter,
  md: FrontmatterInfer,
  markdown: FrontmatterInfer,
  html: FrontmatterInfer,
};

const formatByName = (name, customDelimiter) =>
  ({
    yml: yamlFormatter,
    yaml: yamlFormatter,
    frontmatter: FrontmatterInfer,
    'yaml-frontmatter': frontmatterYAML(customDelimiter),
  }[name]);

export function resolveFormat(collectionOrEntity, entry) {
  // Check for custom delimiter
  const frontmatter_delimiter = collectionOrEntity.get('frontmatter_delimiter');
  const customDelimiter = List.isList(frontmatter_delimiter)
    ? frontmatter_delimiter.toArray()
    : frontmatter_delimiter;

  // If the format is specified in the collection, use that format.
  const formatSpecification = collectionOrEntity.get('format');
  if (formatSpecification) {
    return formatByName(formatSpecification, customDelimiter);
  }

  // If a file already exists, infer the format from its file extension.
  const filePath = entry && entry.path;
  if (filePath) {
    const fileExtension = filePath.split('.').pop();
    return get(extensionFormatters, fileExtension);
  }

  // If creating a new file, and an `extension` is specified in the
  //   collection config, infer the format from that extension.
  const extension = collectionOrEntity.get('extension');
  if (extension) {
    return get(extensionFormatters, extension);
  }

  // If no format is specified and it cannot be inferred, return the default.
  return formatByName('frontmatter', customDelimiter);
}
