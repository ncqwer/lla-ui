import { BrowserRouter, Routes, Route } from 'react-router-dom';

import GlobalLayout from '../layouts/index';

import ThemePage from './theme';
import TryPage from './try';
import ModalPage from './modal';
import ContextPage from './context';
import SnapshotPage from './snapshot';
import WorkFlow from './workflow';
import TabForm from './tab-form';
import Size from './size';
import Slick from './slick';

export default () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GlobalLayout></GlobalLayout>}>
          <Route path="theme/*" element={<ThemePage></ThemePage>}></Route>
          <Route path="try/*" element={<TryPage></TryPage>}></Route>
          <Route path="modal/*" element={<ModalPage></ModalPage>}></Route>
          <Route path="context/*" element={<ContextPage></ContextPage>}></Route>
          <Route path="slick/*" element={<Slick></Slick>}></Route>
          <Route
            path="snapshot/*"
            element={<SnapshotPage></SnapshotPage>}
          ></Route>
          <Route path="workflow/*" element={<WorkFlow></WorkFlow>}></Route>
          <Route path="tab-form/*" element={<TabForm></TabForm>}></Route>
          <Route path="size/*" element={<Size></Size>}></Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
