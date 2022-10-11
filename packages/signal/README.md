# `@lla-ui/signal`

> Yet another state manager with dynamic dependency support



## Install

```bash
yarn add @lla-ui/signal
```

And wrapper your root component with

```jsx
import { SSRSupportWrapper, SharedScope } from '@lla-ui/signal';

<SSRSupportWrapper>
	<SharedScope scopeName="global">{children}</SharedScope>
</SSRSupportWrapper>
```


## Usage

```js
import { signal, useSignal, useSignalState } from '@lla-ui/signal';

const getCategory = signal('getCategory',async ()=>{
	const { data: category } = await fetch('getCategory',{
		method: 'post',
		headers: {
			'Content-Type':'application/json',
		}
	});
	return category;
});

const getGoods = signal('getGoods',async (get)=>{
	const category = await get(getCategory);
	const { data: category } = await fetch('getCategory',{
		method: 'post',
		headers: {
			'Content-Type':'application/json',
		},
		body: JSON.stringify({
			category
		}),
	});
	return category;
});


const [categoryState, refetch] =  useSignalState(getCategory);
const { state, data, error } = () => useSignal(getGoods)

// refetch category will force goods fetcher rerun


// to keep same interface with React.useState ,also privide 

const textAtom = atom('atom_text','hello'); // is special signal whose exec is sync and no dependency

const [text, setText] = useAtom<string>(
	textAtom,'world',
); // which is equal `const [text,setText] = React.useState('world);
```

## Api

Todo
