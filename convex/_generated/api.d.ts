/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as init from "../init.js";
import type * as ml_models from "../ml/models.js";
import type * as ml_predictions from "../ml/predictions.js";
import type * as ml_training from "../ml/training.js";
import type * as students_batchCreate from "../students/batchCreate.js";
import type * as students_create from "../students/create.js";
import type * as students_list from "../students/list.js";
import type * as students_update from "../students/update.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  init: typeof init;
  "ml/models": typeof ml_models;
  "ml/predictions": typeof ml_predictions;
  "ml/training": typeof ml_training;
  "students/batchCreate": typeof students_batchCreate;
  "students/create": typeof students_create;
  "students/list": typeof students_list;
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
