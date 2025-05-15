/**
 * Return unique values from an array based on a key.
 *
 * **Important:** This keeps the *first* values!
 *
 * @param {any[]} a array to check
 * @param {(any) => boolean} filter function to return the value to filter by
 * @returns {any[]} unique values
 * @seealso {@link https://stackoverflow.com/a/9229821/5008962}
 */
export function uniqBy(a, filter) {
    let seen = new Set();
    return a.filter(item => {
        let k = filter(item);
        return seen.has(k) ? false : seen.add(k);
    });
}
