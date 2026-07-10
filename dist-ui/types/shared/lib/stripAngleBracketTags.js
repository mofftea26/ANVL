export function stripAngleBracketTags(value) {
    if (typeof value !== 'string' || !value)
        return '';
    return value.replace(/<[^>]*>/g, '');
}
