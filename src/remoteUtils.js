

export class NetworkError extends Error {
  /**
   * NetworkError constructor
   *
   * @param response - A fetch response @see https://github.com/github/fetch
   * @param message  - Additional descriptive error message
   */
  constructor(response, message) {
    super(message);
    /** @type {string} */
    this.name = 'NetworkError';
    /** @type {string} */
    this.message = message;
    /** @type {string} */
    this.stack = (new Error(message)).stack;
    /** @type {string} */
    this.responseStatus = response.status;
    /** @type {string} */
    this.responseStatusText = response.statusText;
  }
}

/**
 * Convenience function for parsing the response body or throwing an error if the request failed.
 *
 * @param errorMessage - The error message to throw if the response status is a non-2xx code
 * @throws {NetworkError} throws an error if the response status is a non-2xx code
 */
export const parseJSON = errorMessage => response => {
  if (response.ok) {
    return response.json();
  } else {
    throw new NetworkError(response, errorMessage);
  }
};

/**
 * Asynchronously fetches data from a resource endpoint at /api/*.
 *
 * @param  {string} path                      - The name of the resource to fetch.
 * @param  {function(error: Error)} onFailure - A function to perform additional error handling the GET failed for any reason.
 *
 * @return  {Promise<Object[], Object[]>} A promise containing the list of resources, or an empty list if there was an error.
 */
export const getResource = (path, onFailure) => () => {
  return fetch(path, {
    credentials: 'same-origin'
  })
    .then(parseJSON(`Failed to retrieve resource at ${path}`))
    .catch(error => {
      if (onFailure) {
        onFailure(error);
      }
      throw error;
    });
};
