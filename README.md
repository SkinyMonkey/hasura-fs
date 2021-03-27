# hasura-fs
A cloud fs implemented on top of hasura

## What

This project allow a company to add a filesystem on top of a cloud storage provider.
It was designed to be composed into an existing project, hence the very simple "fs\_user" table.
The user\_id is meant to exist somewhere already, and the fs\_user to be a remote extension of it.

## Why

I wanted to show that one of the component of the company i work for could be redone quickly with Hasura

## How

Most of the manipulations can be done through Hasura, the rest is done through a simple node.js api.

The node.js api handles the database events and maintain the cloud storage coherency:

on fs\_user creation, to create a bucket/container dedicated to that user
on fs\_user deletion, to delete that same bucket/container

on file deletion, to delete the blob/object

it also handles the download and upload of objects to and from the right container and object.

### Permissions

Permissions are declined in 3 roles and new permissions can be given to a user about a file/folder:
- owner, can do anything
- writer, can move a file (change the parent\_id), rename it and upload to it
- reader, can read the file and download it

## Who

I did this alone over the course of a week on my free time

## Further features

that could be implemented are:

- other fs backends (s3, azure, ftp, etc)
- md5 checksum on upload and download (computed/checked on upload, sent back on download in headers)
- trash (don't remove the file or folder entity right away)
- archive build for folder download
- folder size
- ...

## Caveats

- I noticed today that a user with reader permission on a file can still upload to it.
A manual check of this in the node.js API is the only solution I see.

- No deep testing, i did a few ugly scripts but it would need a lot more

- I wanted to only allow user creation from a backend app, but could not because of this issue: https://github.com/hasura/graphql-engine/issues/6035

- The tests sometime fail because the event takes some time to fire and the local folder might not be created yet. I could have mitigated it with a subscription that wait over the right user fs state but that's a bit overkill for the scope of this toy app
That's BTW a good question : how would one would wait for the event architecture to be ready and have treated the event? Is subscription the only way here?

# To run this:

```$> ./init.sh```
