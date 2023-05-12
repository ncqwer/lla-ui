import React from 'react';
import {
  Form,
  FormBody,
  useComplexValue,
  Field,
  useFormTabs,
  useFormSubmit,
  FormStoreProvider,
  useRules,
} from '@lla-ui/tab-form';

import { Drawer, Button, Input, Segmented } from 'antd';

const SubForm: React.FC<{
  value?: any;
  onChange?: React.Dispatch<React.SetStateAction<any>>;
}> = ({ value: _value, onChange }) => {
  const [value, isEditing, edit] = useComplexValue(
    'simple-form',
    <>
      <Field name="string">
        <Input prefix="string" />
      </Field>
    </>,
    {
      value: _value,
      onChange,
    },
  );
  console.log(
    '%c [ value ]-9',
    'font-size:13px; background:pink; color:#bf2c9f;',
    value,
  );

  return <Button onClick={edit}>{isEditing ? 'isEditing' : 'edit'}</Button>;
};

const Usage = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [value, isEditing, edit] = useComplexValue(
    'simple',
    <>
      <Field name="string">
        <Input />
      </Field>
      <Field
        name={['complex', 'sub']}
        getValue={(v) => v}
        validate={useRules(
          async (v) => !v && { type: 'error', message: 'required' },
        )}
      >
        <SubForm></SubForm>
      </Field>
    </>,
  );
  console.log(
    '%c [ usage ]-9',
    'font-size:13px; background:pink; color:#bf2c9f;',
    value,
  );

  return <Button onClick={edit}>{isEditing ? 'isEditing' : 'edit'}</Button>;
};

const FormSubmit = () => {
  const [active, submit] = useFormSubmit();
  return active ? <Button onClick={submit!}>submit</Button> : null;
};

const Tabs = () => {
  const { currentTab, formMap, formStore } = useFormTabs();
  const tabNames = React.useMemo(() => Object.keys(formMap), [formMap]);
  console.log(
    '%c [ tabNames ]-64',
    'font-size:13px; background:pink; color:#bf2c9f;',
    tabNames,
    currentTab,
    formMap,
    formStore,
  );
  return (
    <>
      <Drawer open={!!currentTab}>
        <Segmented
          options={tabNames}
          value={currentTab}
          defaultValue={tabNames[1]}
          onChange={(v) => formStore.setCurrentTab(v as string)}
        ></Segmented>
        {currentTab && (
          <Form formState={formMap[currentTab]}>
            <div>
              <FormBody></FormBody>
            </div>
            <FormSubmit></FormSubmit>
          </Form>
        )}
      </Drawer>
    </>
  );
};

export default () => {
  return (
    <FormStoreProvider>
      <Tabs></Tabs>
      <Usage></Usage>
    </FormStoreProvider>
  );
};
