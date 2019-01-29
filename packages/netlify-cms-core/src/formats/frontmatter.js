import matter from 'gray-matter';
import yamlFormatter from './yaml';

const parsers = {
  yaml: {
    parse: input => yamlFormatter.fromFile(input),
    stringify: (metadata, { sortedKeys }) => yamlFormatter.toFile(metadata, sortedKeys),
  },
};

function inferFrontmatterFormat(str) {
  const firstLine = str.substr(0, str.indexOf('\n')).trim();
  if (firstLine.length > 3 && firstLine.substr(0, 3) === '---') {
    // No need to infer, `gray-matter` will handle things like `---toml` for us.
    return;
  }
  switch (firstLine) {
    case '---':
      return getFormatOpts('yaml');
    default:
      throw 'Unrecognized front-matter format.';
  }
}

export const getFormatOpts = format =>
  ({
    yaml: { language: 'yaml', delimiters: '---' },
  }[format]);

class FrontmatterFormatter {
  constructor(format, customDelimiter) {
    this.format = getFormatOpts(format);
    this.customDelimiter = customDelimiter;
  }

  fromFile(content) {
    const format = this.format || inferFrontmatterFormat(content);
    if (this.customDelimiter) this.format.delimiters = this.customDelimiter;
    const result = matter(content, { engines: parsers, ...format });
    return {
      ...result.data,
      body: result.content,
    };
  }

  toFile(data, sortedKeys) {
    const { body = '', ...meta } = data;

    // Stringify to YAML if the format was not set
    const format = this.format || getFormatOpts('yaml');
    if (this.customDelimiter) this.format.delimiters = this.customDelimiter;

    // `sortedKeys` is not recognized by gray-matter, so it gets passed through to the parser
    return matter.stringify(body, meta, { engines: parsers, sortedKeys, ...format });
  }
}

export const FrontmatterInfer = new FrontmatterFormatter();
export const frontmatterYAML = customDelimiter => new FrontmatterFormatter('yaml', customDelimiter);
