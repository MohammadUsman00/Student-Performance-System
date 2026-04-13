/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as clearData from "../clearData.js";
import type * as init from "../init.js";
import type * as ml_models from "../ml/models.js";
import type * as ml_predictions from "../ml/predictions.js";
import type * as ml_serviceUrl from "../ml/serviceUrl.js";
import type * as ml_training from "../ml/training.js";
import type * as students_batchCreate from "../students/batchCreate.js";
import type * as students_create from "../students/create.js";
import type * as students_defaults from "../students/defaults.js";
import type * as students_list from "../students/list.js";
import type * as students_partialArgs from "../students/partialArgs.js";
import type * as students_update from "../students/update.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  clearData: typeof clearData;
  init: typeof init;
  "ml/models": typeof ml_models;
  "ml/predictions": typeof ml_predictions;
  "ml/serviceUrl": typeof ml_serviceUrl;
  "ml/training": typeof ml_training;
  "students/batchCreate": typeof students_batchCreate;
  "students/create": typeof students_create;
  "students/defaults": typeof students_defaults;
  "students/list": typeof students_list;
  "students/partialArgs": typeof students_partialArgs;
  "students/update": typeof students_update;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
