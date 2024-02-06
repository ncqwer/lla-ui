import { Plugin, TreeNode, TreeNodeId, TreeStore } from './type';

export const createTreeStore = (...plugins: Plugin[]): TreeStore => {
  const plugin = composePlugin(...plugins);
  const store = makeBasicTreeStore();
  const api = 
};

function makeBasicTreeStore() {
  const nodeMap: Record<TreeNodeId, TreeNode> = {};
  return {
    nodeMap,
    rootIds: [],
  };
}

function compose<Fn extends (...args: any[]) => any, T extends Fn[]>(
  ...fns: T
) {
  type Params = T extends [(...args: any[]) => any, ...any[]]
    ? Parameters<T[0]>
    : never;
  type Last = T extends [any, ...infer U] ? U : never;
  type Ret = ReturnType<T[Last['length']]>;
  return fns.reduce(
    (next, fn) => {
      return (...args: any) => next(fn(...args));
    },
    (v: any) => v,
  ) as unknown as (...args: Params) => Ret;
}

const ans = compose(
  (num: number, str: string) => str,
  (str: string) => 1,
);

function composePlugin(...plugins: Plugin[]): Plugin {
  type PluginRet = ReturnType<Plugin>;
  type Api = Required<Pick<PluginRet, 'queries' | 'transforms'>>;
  type LifetimeArrTmp = Required<
    Pick<PluginRet, 'fromChildren' | 'fromParent'>
  >;
  type LifetimeArr = {
    [k in keyof LifetimeArrTmp]: LifetimeArrTmp[k][];
  };
  return (store: TreeStore) => {
    const { fromParent, fromChildren, queries, transforms } = plugins
      .map((fn) => fn(store))
      .reduce(
        ({ fromParent, fromChildren, queries, transforms }, plugin) => {
          if (plugin.fromParent) fromParent.push(plugin.fromParent);
          if (plugin.fromChildren) fromChildren.push(plugin.fromChildren);
          if (plugin.queries) Object.assign(queries, plugin.queries);
          if (plugin.transforms) Object.assign(transforms, plugin.transfroms);
          return {
            fromParent,
            fromChildren,
            queries,
            transforms,
          };
        },
        {
          fromParent: [],
          fromChildren: [],
          queries: {},
          transforms: {},
        } as LifetimeArr & Api,
      );
    return {
      queries,
      transforms,
      fromChildren(...args) {
        const res = {};
        for (const fn of fromChildren) {
          Object.assign(res, fn(...args));
        }
        return res;
      },
      fromParent(...args) {
        const res = {};
        for (const fn of fromParent) {
          Object.assign(res, fn(...args));
        }
        return res;
      },
    } as PluginRet;
  };
}

const basic: Plugin = (store) => {
  function fromParent() {}
  function fromChildren() {}

  // queries

  // transfroms
  function traverse() {}
};

// 一次traverse必定伴随着fromeParent的调用，至于fromChildren的调用，在非初始化外是没有意义的。因为更新不来自底部。
type a = [(...args: any) => any, 2, 3] extends [infer U, ...any] ? U : never;


[/api/approval-form:POST,/api/process-log:POST,/api/car-access-record:POST,/api/car-access-record:PUT,/api/car-access-record:DELETE,/api/enum-value:POST,/api/enum-value:PUT,/api/enum-value:DELETE,/api/enum-value/batch:POST,/api/enum-type:POST,/api/enum-type:PUT,/api/enum-type:DELETE,/api/personnel-qualification/batch:POST,/api/personnel-qualification/batch:PUT,/api/test-question:GET,/api/test-paper:GET,/api/examination:GET,/api/person:GET,/api/person:POST,/api/person:PUT,/api/personal-access-record:POST,/api/personal-access-record:PUT,/api/personal-access-record:DELETE,/api/organization-manage:GET,/api/l-c-a-p-user:POST,/api/l-c-a-p-user:PUT,/api/l-c-a-p-user:DELETE,/api/l-c-a-p-role-per-mapping:POST,/api/l-c-a-p-role-per-mapping:PUT,/api/l-c-a-p-role-per-mapping:DELETE,/api/l-c-a-p-per-res-mapping:POST,/api/l-c-a-p-per-res-mapping:DELETE,/api/l-c-a-p-user-role-mapping:POST,/api/l-c-a-p-user-role-mapping:DELETE,/api/l-c-a-p-role:GET,/api/l-c-a-p-role:POST,/api/l-c-a-p-role:PUT,/api/l-c-a-p-role:DELETE,/api/l-c-a-p-permission:POST,/api/l-c-a-p-permission:PUT,/api/l-c-a-p-permission:DELETE,/api/lcplogics/loadCompanySelect:POST,/api/lcplogics/getOneAreaByOrganizationId:POST,/api/lcplogics/getLatestExamRecord:POST,/api/lcplogics/loadApprovalSubmitByPerson:POST,/api/lcplogics/getTenantryIdByUserId:POST,/api/lcplogics/getUserCorrectByExamId:POST,/api/lcplogics/getUserGrade:POST,/api/lcplogics/loadTttTableView_Ka_6:POST,/api/lcplogics/computeRepeatUserGrade:POST,/api/lcplogics/getMyExamPageList:POST,/api/lcplogics/getExamPaperByExamId:POST,/api/lcplogics/studyInformationPageList:POST,/api/lcplogics/getUserByUserId:POST,/api/lcplogics/loadQqSelect_Pi_2LCAPPermission2:POST,/api/lcplogics/ResetPassword:POST,/api/lcplogics/loadTttTableView_Ka_1:POST,/api/lcplogics/setUserExamination:POST,/api/lcplogics/getPhoneFromPerson:POST,/api/lcplogics/getPersonnelQualificationListByPersonId:POST,/api/lcplogics/loadDictionarySelect_IE_1EnumType:POST,/api/lcplogics/computeExamintiaonUserGrade:POST,/api/lcplogics/estimateUserExaminationGrade:POST,/api/lcplogics/loadPersonnelCreatePageSelect_IE_4:POST,/api/lcplogics/LCAPGetUserByUserId:POST,/api/lcplogics/LCAPGetAllUsers:POST,/api/lcplogics/LCAPGetUserTableView:POST,/api/lcplogics/LCAPGetMappingByPermissionIdAndResourceId:POST,/api/lcplogics/LCAPGetScopeResourceByRoleId:POST,/api/lcplogics/LCAPGetRoleBindUserList:POST,/api/lcplogics/LCAPLoadRoleManagementTableView:POST,/api/lcplogics/LCAPLoadUserRoleMappingTableView:POST,/api/lcplogics/LCAPGetRolePermissionList:POST,/api/lcplogics/LCAPGetPermissionByRoleId:POST,/api/lcplogics/LCAPLoadResourceTableView:POST,/api/lcplogics/LCAPIsRoleNameRepeated:POST,/api/lcplogics/loadDictionaryTableView_IE_3:POST,/api/lcplogics/loadDictionaryTableView_IE_1:POST,/api/lcplogics/getOnlineExaminationQuestionListByPaperId:POST,/api/lcplogics/estimateUserExaminationQualification:POST,/api/lcplogics/loadTttSelect_Ka_1Tenantry:POST,/api/lcplogics/timedTaskDataDayCheck:POST,/api/lcplogics/LoginUser:POST,/api/lcplogics/addSysOperateLog:POST,/api/lcplogics/loadQqTableView_Pi_3:POST,/api/lcplogics/loadQqSelect_Pi_1LCAPRole2:POST,/api/lcplogics/loadAaaaaTableView_Pi_1:POST,/api/lcplogics/getExamCount:POST,/api/lcplogics/loadTttTableView_Ka_3:POST,/api/lcplogics/getRepeatExaminationQuestionListByPaperId:POST,/api/lcplogics/loadResourceListTableView_Pi_1:POST,/api/lcplogics/loadTttSelect_Ka_24Tenantry:POST,/api/lcplogics/getUserExamCount:POST,/api/lcplogics/saveExamUserMapScore:POST,/api/lcplogics/getPersonPhoneAndIDCard:POST,/api/excel_parser/parseAllSheet:POST,/upload:POST,/upload/download_files:POST]