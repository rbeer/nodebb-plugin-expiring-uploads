# nodebb-plugin-expiring-uploads
### Hide and expire users uploads.
The name actually only tells half the story. This plugin lets you:

1. Hide uploads of definable filetypes behind a hash/timestamp/filename combination. Uploads are not stored in the standard path (public/files). This ensures, that even when the filename is known, it's pretty hard to guess its location.

2. Set an expiration time(range) for those hash/timestamp/filename urls. Every setting > 0 will have uploads handled by this plugin expire.

**PLEASE NOTE**: Expiration is calculated at request time. If you uploaded a file 7 days ago and now decide to lower the expiration time from 10 to 5 days, this file will be treated as expired.

## Installation
1. `npm install nodebb-plugin-expiring-uploads`

2. Activate the plugin in the ACP.

3. Adjust the settings! Standard expiration time is 0 = uploads never expire.
