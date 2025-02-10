
The Trubrics SDK is compatible with both Javascript Web and Node.js applications. For more information please visit [Trubrics docs](https://docs.trubrics.com/)

```js
import { Trubrics } from  "@trubrics/trubrics";

export  const  trubrics = new  Trubrics({
	apiKey:  TRUBRICS_API_KEY
});

trubrics.track({
	event:  "Report downloaded",
	user_id: "username"
});

```
