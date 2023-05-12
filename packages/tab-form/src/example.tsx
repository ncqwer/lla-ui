import React from 'react';
import {
  Form,
  FormBody,
  useComplexValue,
  Field,
  useFormTabs,
  useFormSubmit,
  FormStoreProvider,
} from '.';

const SubForm: React.FC<{
  value?: any;
  onChange?: React.Dispatch<React.SetStateAction<any>>;
}> = ({ value: _value, onChange }) => {
  const [value, isEditing, edit] = useComplexValue(
    'simple',
    <>
      <Field name="string">
        <input type="text" />
      </Field>
      <Field name="file">
        <input type="file" />
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

  return <button onClick={edit}>{isEditing ? 'isEditing' : 'edit'}</button>;
};

const Usage = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, isEditing, edit] = useComplexValue(
    'simple',
    <>
      <Field name="string">
        <input type="text" />
      </Field>
      <Field name="file">
        <input type="file" />
      </Field>
      <Field name={['complex', 'sub']}>
        <SubForm></SubForm>
      </Field>
    </>,
  );

  return <button onClick={edit}>{isEditing ? 'isEditing' : 'edit'}</button>;
};

const Drawer = null as any;

const FormSubmit = () => {
  const [active, submit] = useFormSubmit();
  return <button onClick={submit!}>{active}</button>;
};

const Tabs = () => {
  const { currentTab, formMap, formStore } = useFormTabs();
  const tabNames = React.useMemo(() => Object.keys(formMap), [formMap]);
  return (
    <div>
      {tabNames.map((tabName) => (
        <div>{tabName}</div>
      ))}

      <Drawer visible={!currentTab}>
        {currentTab && (
          <Form formState={formStore[currentTab]}>
            <div>
              <FormBody></FormBody>
            </div>

            <FormSubmit></FormSubmit>
          </Form>
        )}
      </Drawer>
    </div>
  );
};

export const Page = () => {
  return (
    <FormStoreProvider>
      <Tabs></Tabs>
      <Usage></Usage>
    </FormStoreProvider>
  );
};
