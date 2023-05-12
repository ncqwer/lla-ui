import React, { PropsWithChildren } from 'react';

function Tabs({
  value,
  onChange,
  children,
}: PropsWithChildren<{
  value: any;
  onChange: React.Dispatch<React.SetStateAction<any>>;
}>) {
  return (
    <div>
      <TabsHeader></TabsHeader>
      {children}
    </div>
  );
}

export default () => {
  const [colors] = React.useState(() => [
    'red',
    'blue',
    'green',
    'yellow',
    'purple',
    'gray',
  ]);
  const [currentColor, setCurrentColor] = React.useState('red');
  return <Tabs value={currentColor} onChange={setCurrentColor}></Tabs>;
};
