To implement a new fs backend, implement the same functions as in the local implementation.
Please note that the return of each is a promise which handles every stream events as
they are not consistent across apis.
Don't forget to update the selector.js file and set the FS\_BACKEND env variable accordingly.
