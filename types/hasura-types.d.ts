export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
export type MakeEmpty<
  T extends { [key: string]: unknown },
  K extends keyof T,
> = { [_ in K]?: never };
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never;
    };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  bigint: { input: any; output: any };
  jsonb: { input: any; output: any };
  numeric: { input: any; output: any };
  timestamptz: { input: any; output: any };
  uuid: { input: any; output: any };
};

/** Boolean expression to compare columns of type "Boolean". All fields are combined with logical 'AND'. */
export type Boolean_Comparison_Exp = {
  _eq?: InputMaybe<Scalars["Boolean"]["input"]>;
  _gt?: InputMaybe<Scalars["Boolean"]["input"]>;
  _gte?: InputMaybe<Scalars["Boolean"]["input"]>;
  _in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  _is_null?: InputMaybe<Scalars["Boolean"]["input"]>;
  _lt?: InputMaybe<Scalars["Boolean"]["input"]>;
  _lte?: InputMaybe<Scalars["Boolean"]["input"]>;
  _neq?: InputMaybe<Scalars["Boolean"]["input"]>;
  _nin?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
};

/** Boolean expression to compare columns of type "Int". All fields are combined with logical 'AND'. */
export type Int_Comparison_Exp = {
  _eq?: InputMaybe<Scalars["Int"]["input"]>;
  _gt?: InputMaybe<Scalars["Int"]["input"]>;
  _gte?: InputMaybe<Scalars["Int"]["input"]>;
  _in?: InputMaybe<Array<Scalars["Int"]["input"]>>;
  _is_null?: InputMaybe<Scalars["Boolean"]["input"]>;
  _lt?: InputMaybe<Scalars["Int"]["input"]>;
  _lte?: InputMaybe<Scalars["Int"]["input"]>;
  _neq?: InputMaybe<Scalars["Int"]["input"]>;
  _nin?: InputMaybe<Array<Scalars["Int"]["input"]>>;
};

/** Boolean expression to compare columns of type "String". All fields are combined with logical 'AND'. */
export type String_Comparison_Exp = {
  _eq?: InputMaybe<Scalars["String"]["input"]>;
  _gt?: InputMaybe<Scalars["String"]["input"]>;
  _gte?: InputMaybe<Scalars["String"]["input"]>;
  /** does the column match the given case-insensitive pattern */
  _ilike?: InputMaybe<Scalars["String"]["input"]>;
  _in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  /** does the column match the given POSIX regular expression, case insensitive */
  _iregex?: InputMaybe<Scalars["String"]["input"]>;
  _is_null?: InputMaybe<Scalars["Boolean"]["input"]>;
  /** does the column match the given pattern */
  _like?: InputMaybe<Scalars["String"]["input"]>;
  _lt?: InputMaybe<Scalars["String"]["input"]>;
  _lte?: InputMaybe<Scalars["String"]["input"]>;
  _neq?: InputMaybe<Scalars["String"]["input"]>;
  /** does the column NOT match the given case-insensitive pattern */
  _nilike?: InputMaybe<Scalars["String"]["input"]>;
  _nin?: InputMaybe<Array<Scalars["String"]["input"]>>;
  /** does the column NOT match the given POSIX regular expression, case insensitive */
  _niregex?: InputMaybe<Scalars["String"]["input"]>;
  /** does the column NOT match the given pattern */
  _nlike?: InputMaybe<Scalars["String"]["input"]>;
  /** does the column NOT match the given POSIX regular expression, case sensitive */
  _nregex?: InputMaybe<Scalars["String"]["input"]>;
  /** does the column NOT match the given SQL regular expression */
  _nsimilar?: InputMaybe<Scalars["String"]["input"]>;
  /** does the column match the given POSIX regular expression, case sensitive */
  _regex?: InputMaybe<Scalars["String"]["input"]>;
  /** does the column match the given SQL regular expression */
  _similar?: InputMaybe<Scalars["String"]["input"]>;
};

/** columns and relationships of "accounts" */
export type Accounts = {
  __typename?: "accounts";
  access_token?: Maybe<Scalars["String"]["output"]>;
  created_at: Scalars["timestamptz"]["output"];
  expires_at?: Maybe<Scalars["bigint"]["output"]>;
  id: Scalars["uuid"]["output"];
  id_token?: Maybe<Scalars["String"]["output"]>;
  oauth_token?: Maybe<Scalars["String"]["output"]>;
  oauth_token_secret?: Maybe<Scalars["String"]["output"]>;
  provider: Scalars["String"]["output"];
  provider_account_id: Scalars["String"]["output"];
  refresh_token?: Maybe<Scalars["String"]["output"]>;
  scope?: Maybe<Scalars["String"]["output"]>;
  session_state?: Maybe<Scalars["String"]["output"]>;
  token_type?: Maybe<Scalars["String"]["output"]>;
  type: Scalars["String"]["output"];
  /** An object relationship */
  user: Users;
  user_id: Scalars["uuid"]["output"];
};

/** aggregated selection of "accounts" */
export type Accounts_Aggregate = {
  __typename?: "accounts_aggregate";
  aggregate?: Maybe<Accounts_Aggregate_Fields>;
  nodes: Array<Accounts>;
};

export type Accounts_Aggregate_Bool_Exp = {
  count?: InputMaybe<Accounts_Aggregate_Bool_Exp_Count>;
};

export type Accounts_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Accounts_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]["input"]>;
  filter?: InputMaybe<Accounts_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "accounts" */
export type Accounts_Aggregate_Fields = {
  __typename?: "accounts_aggregate_fields";
  avg?: Maybe<Accounts_Avg_Fields>;
  count: Scalars["Int"]["output"];
  max?: Maybe<Accounts_Max_Fields>;
  min?: Maybe<Accounts_Min_Fields>;
  stddev?: Maybe<Accounts_Stddev_Fields>;
  stddev_pop?: Maybe<Accounts_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Accounts_Stddev_Samp_Fields>;
  sum?: Maybe<Accounts_Sum_Fields>;
  var_pop?: Maybe<Accounts_Var_Pop_Fields>;
  var_samp?: Maybe<Accounts_Var_Samp_Fields>;
  variance?: Maybe<Accounts_Variance_Fields>;
};

/** aggregate fields of "accounts" */
export type Accounts_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Accounts_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]["input"]>;
};

/** order by aggregate values of table "accounts" */
export type Accounts_Aggregate_Order_By = {
  avg?: InputMaybe<Accounts_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Accounts_Max_Order_By>;
  min?: InputMaybe<Accounts_Min_Order_By>;
  stddev?: InputMaybe<Accounts_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Accounts_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Accounts_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Accounts_Sum_Order_By>;
  var_pop?: InputMaybe<Accounts_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Accounts_Var_Samp_Order_By>;
  variance?: InputMaybe<Accounts_Variance_Order_By>;
};

/** input type for inserting array relation for remote table "accounts" */
export type Accounts_Arr_Rel_Insert_Input = {
  data: Array<Accounts_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<Accounts_On_Conflict>;
};

/** aggregate avg on columns */
export type Accounts_Avg_Fields = {
  __typename?: "accounts_avg_fields";
  expires_at?: Maybe<Scalars["Float"]["output"]>;
};

/** order by avg() on columns of table "accounts" */
export type Accounts_Avg_Order_By = {
  expires_at?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "accounts". All fields are combined with a logical 'AND'. */
export type Accounts_Bool_Exp = {
  _and?: InputMaybe<Array<Accounts_Bool_Exp>>;
  _not?: InputMaybe<Accounts_Bool_Exp>;
  _or?: InputMaybe<Array<Accounts_Bool_Exp>>;
  access_token?: InputMaybe<String_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  expires_at?: InputMaybe<Bigint_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  id_token?: InputMaybe<String_Comparison_Exp>;
  oauth_token?: InputMaybe<String_Comparison_Exp>;
  oauth_token_secret?: InputMaybe<String_Comparison_Exp>;
  provider?: InputMaybe<String_Comparison_Exp>;
  provider_account_id?: InputMaybe<String_Comparison_Exp>;
  refresh_token?: InputMaybe<String_Comparison_Exp>;
  scope?: InputMaybe<String_Comparison_Exp>;
  session_state?: InputMaybe<String_Comparison_Exp>;
  token_type?: InputMaybe<String_Comparison_Exp>;
  type?: InputMaybe<String_Comparison_Exp>;
  user?: InputMaybe<Users_Bool_Exp>;
  user_id?: InputMaybe<Uuid_Comparison_Exp>;
};

/** unique or primary key constraints on table "accounts" */
export enum Accounts_Constraint {
  /** unique or primary key constraint on columns "id" */
  AccountsPkey = "accounts_pkey",
  /** unique or primary key constraint on columns "provider", "provider_account_id" */
  AccountsProviderProviderAccountIdKey = "accounts_provider_provider_account_id_key",
}

/** input type for incrementing numeric columns in table "accounts" */
export type Accounts_Inc_Input = {
  expires_at?: InputMaybe<Scalars["bigint"]["input"]>;
};

/** input type for inserting data into table "accounts" */
export type Accounts_Insert_Input = {
  access_token?: InputMaybe<Scalars["String"]["input"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  expires_at?: InputMaybe<Scalars["bigint"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  id_token?: InputMaybe<Scalars["String"]["input"]>;
  oauth_token?: InputMaybe<Scalars["String"]["input"]>;
  oauth_token_secret?: InputMaybe<Scalars["String"]["input"]>;
  provider?: InputMaybe<Scalars["String"]["input"]>;
  provider_account_id?: InputMaybe<Scalars["String"]["input"]>;
  refresh_token?: InputMaybe<Scalars["String"]["input"]>;
  scope?: InputMaybe<Scalars["String"]["input"]>;
  session_state?: InputMaybe<Scalars["String"]["input"]>;
  token_type?: InputMaybe<Scalars["String"]["input"]>;
  type?: InputMaybe<Scalars["String"]["input"]>;
  user?: InputMaybe<Users_Obj_Rel_Insert_Input>;
  user_id?: InputMaybe<Scalars["uuid"]["input"]>;
};

/** aggregate max on columns */
export type Accounts_Max_Fields = {
  __typename?: "accounts_max_fields";
  access_token?: Maybe<Scalars["String"]["output"]>;
  created_at?: Maybe<Scalars["timestamptz"]["output"]>;
  expires_at?: Maybe<Scalars["bigint"]["output"]>;
  id?: Maybe<Scalars["uuid"]["output"]>;
  id_token?: Maybe<Scalars["String"]["output"]>;
  oauth_token?: Maybe<Scalars["String"]["output"]>;
  oauth_token_secret?: Maybe<Scalars["String"]["output"]>;
  provider?: Maybe<Scalars["String"]["output"]>;
  provider_account_id?: Maybe<Scalars["String"]["output"]>;
  refresh_token?: Maybe<Scalars["String"]["output"]>;
  scope?: Maybe<Scalars["String"]["output"]>;
  session_state?: Maybe<Scalars["String"]["output"]>;
  token_type?: Maybe<Scalars["String"]["output"]>;
  type?: Maybe<Scalars["String"]["output"]>;
  user_id?: Maybe<Scalars["uuid"]["output"]>;
};

/** order by max() on columns of table "accounts" */
export type Accounts_Max_Order_By = {
  access_token?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  expires_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  id_token?: InputMaybe<Order_By>;
  oauth_token?: InputMaybe<Order_By>;
  oauth_token_secret?: InputMaybe<Order_By>;
  provider?: InputMaybe<Order_By>;
  provider_account_id?: InputMaybe<Order_By>;
  refresh_token?: InputMaybe<Order_By>;
  scope?: InputMaybe<Order_By>;
  session_state?: InputMaybe<Order_By>;
  token_type?: InputMaybe<Order_By>;
  type?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Accounts_Min_Fields = {
  __typename?: "accounts_min_fields";
  access_token?: Maybe<Scalars["String"]["output"]>;
  created_at?: Maybe<Scalars["timestamptz"]["output"]>;
  expires_at?: Maybe<Scalars["bigint"]["output"]>;
  id?: Maybe<Scalars["uuid"]["output"]>;
  id_token?: Maybe<Scalars["String"]["output"]>;
  oauth_token?: Maybe<Scalars["String"]["output"]>;
  oauth_token_secret?: Maybe<Scalars["String"]["output"]>;
  provider?: Maybe<Scalars["String"]["output"]>;
  provider_account_id?: Maybe<Scalars["String"]["output"]>;
  refresh_token?: Maybe<Scalars["String"]["output"]>;
  scope?: Maybe<Scalars["String"]["output"]>;
  session_state?: Maybe<Scalars["String"]["output"]>;
  token_type?: Maybe<Scalars["String"]["output"]>;
  type?: Maybe<Scalars["String"]["output"]>;
  user_id?: Maybe<Scalars["uuid"]["output"]>;
};

/** order by min() on columns of table "accounts" */
export type Accounts_Min_Order_By = {
  access_token?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  expires_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  id_token?: InputMaybe<Order_By>;
  oauth_token?: InputMaybe<Order_By>;
  oauth_token_secret?: InputMaybe<Order_By>;
  provider?: InputMaybe<Order_By>;
  provider_account_id?: InputMaybe<Order_By>;
  refresh_token?: InputMaybe<Order_By>;
  scope?: InputMaybe<Order_By>;
  session_state?: InputMaybe<Order_By>;
  token_type?: InputMaybe<Order_By>;
  type?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "accounts" */
export type Accounts_Mutation_Response = {
  __typename?: "accounts_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"]["output"];
  /** data from the rows affected by the mutation */
  returning: Array<Accounts>;
};

/** on_conflict condition type for table "accounts" */
export type Accounts_On_Conflict = {
  constraint: Accounts_Constraint;
  update_columns?: Array<Accounts_Update_Column>;
  where?: InputMaybe<Accounts_Bool_Exp>;
};

/** Ordering options when selecting data from "accounts". */
export type Accounts_Order_By = {
  access_token?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  expires_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  id_token?: InputMaybe<Order_By>;
  oauth_token?: InputMaybe<Order_By>;
  oauth_token_secret?: InputMaybe<Order_By>;
  provider?: InputMaybe<Order_By>;
  provider_account_id?: InputMaybe<Order_By>;
  refresh_token?: InputMaybe<Order_By>;
  scope?: InputMaybe<Order_By>;
  session_state?: InputMaybe<Order_By>;
  token_type?: InputMaybe<Order_By>;
  type?: InputMaybe<Order_By>;
  user?: InputMaybe<Users_Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** primary key columns input for table: accounts */
export type Accounts_Pk_Columns_Input = {
  id: Scalars["uuid"]["input"];
};

/** select columns of table "accounts" */
export enum Accounts_Select_Column {
  /** column name */
  AccessToken = "access_token",
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  ExpiresAt = "expires_at",
  /** column name */
  Id = "id",
  /** column name */
  IdToken = "id_token",
  /** column name */
  OauthToken = "oauth_token",
  /** column name */
  OauthTokenSecret = "oauth_token_secret",
  /** column name */
  Provider = "provider",
  /** column name */
  ProviderAccountId = "provider_account_id",
  /** column name */
  RefreshToken = "refresh_token",
  /** column name */
  Scope = "scope",
  /** column name */
  SessionState = "session_state",
  /** column name */
  TokenType = "token_type",
  /** column name */
  Type = "type",
  /** column name */
  UserId = "user_id",
}

/** input type for updating data in table "accounts" */
export type Accounts_Set_Input = {
  access_token?: InputMaybe<Scalars["String"]["input"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  expires_at?: InputMaybe<Scalars["bigint"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  id_token?: InputMaybe<Scalars["String"]["input"]>;
  oauth_token?: InputMaybe<Scalars["String"]["input"]>;
  oauth_token_secret?: InputMaybe<Scalars["String"]["input"]>;
  provider?: InputMaybe<Scalars["String"]["input"]>;
  provider_account_id?: InputMaybe<Scalars["String"]["input"]>;
  refresh_token?: InputMaybe<Scalars["String"]["input"]>;
  scope?: InputMaybe<Scalars["String"]["input"]>;
  session_state?: InputMaybe<Scalars["String"]["input"]>;
  token_type?: InputMaybe<Scalars["String"]["input"]>;
  type?: InputMaybe<Scalars["String"]["input"]>;
  user_id?: InputMaybe<Scalars["uuid"]["input"]>;
};

/** aggregate stddev on columns */
export type Accounts_Stddev_Fields = {
  __typename?: "accounts_stddev_fields";
  expires_at?: Maybe<Scalars["Float"]["output"]>;
};

/** order by stddev() on columns of table "accounts" */
export type Accounts_Stddev_Order_By = {
  expires_at?: InputMaybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Accounts_Stddev_Pop_Fields = {
  __typename?: "accounts_stddev_pop_fields";
  expires_at?: Maybe<Scalars["Float"]["output"]>;
};

/** order by stddev_pop() on columns of table "accounts" */
export type Accounts_Stddev_Pop_Order_By = {
  expires_at?: InputMaybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Accounts_Stddev_Samp_Fields = {
  __typename?: "accounts_stddev_samp_fields";
  expires_at?: Maybe<Scalars["Float"]["output"]>;
};

/** order by stddev_samp() on columns of table "accounts" */
export type Accounts_Stddev_Samp_Order_By = {
  expires_at?: InputMaybe<Order_By>;
};

/** Streaming cursor of the table "accounts" */
export type Accounts_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Accounts_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Accounts_Stream_Cursor_Value_Input = {
  access_token?: InputMaybe<Scalars["String"]["input"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  expires_at?: InputMaybe<Scalars["bigint"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  id_token?: InputMaybe<Scalars["String"]["input"]>;
  oauth_token?: InputMaybe<Scalars["String"]["input"]>;
  oauth_token_secret?: InputMaybe<Scalars["String"]["input"]>;
  provider?: InputMaybe<Scalars["String"]["input"]>;
  provider_account_id?: InputMaybe<Scalars["String"]["input"]>;
  refresh_token?: InputMaybe<Scalars["String"]["input"]>;
  scope?: InputMaybe<Scalars["String"]["input"]>;
  session_state?: InputMaybe<Scalars["String"]["input"]>;
  token_type?: InputMaybe<Scalars["String"]["input"]>;
  type?: InputMaybe<Scalars["String"]["input"]>;
  user_id?: InputMaybe<Scalars["uuid"]["input"]>;
};

/** aggregate sum on columns */
export type Accounts_Sum_Fields = {
  __typename?: "accounts_sum_fields";
  expires_at?: Maybe<Scalars["bigint"]["output"]>;
};

/** order by sum() on columns of table "accounts" */
export type Accounts_Sum_Order_By = {
  expires_at?: InputMaybe<Order_By>;
};

/** update columns of table "accounts" */
export enum Accounts_Update_Column {
  /** column name */
  AccessToken = "access_token",
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  ExpiresAt = "expires_at",
  /** column name */
  Id = "id",
  /** column name */
  IdToken = "id_token",
  /** column name */
  OauthToken = "oauth_token",
  /** column name */
  OauthTokenSecret = "oauth_token_secret",
  /** column name */
  Provider = "provider",
  /** column name */
  ProviderAccountId = "provider_account_id",
  /** column name */
  RefreshToken = "refresh_token",
  /** column name */
  Scope = "scope",
  /** column name */
  SessionState = "session_state",
  /** column name */
  TokenType = "token_type",
  /** column name */
  Type = "type",
  /** column name */
  UserId = "user_id",
}

export type Accounts_Updates = {
  /** increments the numeric columns with given value of the filtered values */
  _inc?: InputMaybe<Accounts_Inc_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Accounts_Set_Input>;
  /** filter the rows which have to be updated */
  where: Accounts_Bool_Exp;
};

/** aggregate var_pop on columns */
export type Accounts_Var_Pop_Fields = {
  __typename?: "accounts_var_pop_fields";
  expires_at?: Maybe<Scalars["Float"]["output"]>;
};

/** order by var_pop() on columns of table "accounts" */
export type Accounts_Var_Pop_Order_By = {
  expires_at?: InputMaybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Accounts_Var_Samp_Fields = {
  __typename?: "accounts_var_samp_fields";
  expires_at?: Maybe<Scalars["Float"]["output"]>;
};

/** order by var_samp() on columns of table "accounts" */
export type Accounts_Var_Samp_Order_By = {
  expires_at?: InputMaybe<Order_By>;
};

/** aggregate variance on columns */
export type Accounts_Variance_Fields = {
  __typename?: "accounts_variance_fields";
  expires_at?: Maybe<Scalars["Float"]["output"]>;
};

/** order by variance() on columns of table "accounts" */
export type Accounts_Variance_Order_By = {
  expires_at?: InputMaybe<Order_By>;
};

/** columns and relationships of "badma.ais" */
export type Badma_Ais = {
  __typename?: "badma_ais";
  created_at: Scalars["timestamptz"]["output"];
  id: Scalars["uuid"]["output"];
  options: Scalars["jsonb"]["output"];
  updated_at: Scalars["timestamptz"]["output"];
  /** An object relationship */
  user: Users;
  user_id: Scalars["uuid"]["output"];
};

/** columns and relationships of "badma.ais" */
export type Badma_AisOptionsArgs = {
  path?: InputMaybe<Scalars["String"]["input"]>;
};

/** aggregated selection of "badma.ais" */
export type Badma_Ais_Aggregate = {
  __typename?: "badma_ais_aggregate";
  aggregate?: Maybe<Badma_Ais_Aggregate_Fields>;
  nodes: Array<Badma_Ais>;
};

export type Badma_Ais_Aggregate_Bool_Exp = {
  count?: InputMaybe<Badma_Ais_Aggregate_Bool_Exp_Count>;
};

export type Badma_Ais_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Badma_Ais_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]["input"]>;
  filter?: InputMaybe<Badma_Ais_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "badma.ais" */
export type Badma_Ais_Aggregate_Fields = {
  __typename?: "badma_ais_aggregate_fields";
  count: Scalars["Int"]["output"];
  max?: Maybe<Badma_Ais_Max_Fields>;
  min?: Maybe<Badma_Ais_Min_Fields>;
};

/** aggregate fields of "badma.ais" */
export type Badma_Ais_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Badma_Ais_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]["input"]>;
};

/** order by aggregate values of table "badma.ais" */
export type Badma_Ais_Aggregate_Order_By = {
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Badma_Ais_Max_Order_By>;
  min?: InputMaybe<Badma_Ais_Min_Order_By>;
};

/** append existing jsonb value of filtered columns with new jsonb value */
export type Badma_Ais_Append_Input = {
  options?: InputMaybe<Scalars["jsonb"]["input"]>;
};

/** input type for inserting array relation for remote table "badma.ais" */
export type Badma_Ais_Arr_Rel_Insert_Input = {
  data: Array<Badma_Ais_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<Badma_Ais_On_Conflict>;
};

/** Boolean expression to filter rows from the table "badma.ais". All fields are combined with a logical 'AND'. */
export type Badma_Ais_Bool_Exp = {
  _and?: InputMaybe<Array<Badma_Ais_Bool_Exp>>;
  _not?: InputMaybe<Badma_Ais_Bool_Exp>;
  _or?: InputMaybe<Array<Badma_Ais_Bool_Exp>>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  options?: InputMaybe<Jsonb_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  user?: InputMaybe<Users_Bool_Exp>;
  user_id?: InputMaybe<Uuid_Comparison_Exp>;
};

/** unique or primary key constraints on table "badma.ais" */
export enum Badma_Ais_Constraint {
  /** unique or primary key constraint on columns "id" */
  AisPkey = "ais_pkey",
}

/** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
export type Badma_Ais_Delete_At_Path_Input = {
  options?: InputMaybe<Array<Scalars["String"]["input"]>>;
};

/** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
export type Badma_Ais_Delete_Elem_Input = {
  options?: InputMaybe<Scalars["Int"]["input"]>;
};

/** delete key/value pair or string element. key/value pairs are matched based on their key value */
export type Badma_Ais_Delete_Key_Input = {
  options?: InputMaybe<Scalars["String"]["input"]>;
};

/** input type for inserting data into table "badma.ais" */
export type Badma_Ais_Insert_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  options?: InputMaybe<Scalars["jsonb"]["input"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  user?: InputMaybe<Users_Obj_Rel_Insert_Input>;
  user_id?: InputMaybe<Scalars["uuid"]["input"]>;
};

/** aggregate max on columns */
export type Badma_Ais_Max_Fields = {
  __typename?: "badma_ais_max_fields";
  created_at?: Maybe<Scalars["timestamptz"]["output"]>;
  id?: Maybe<Scalars["uuid"]["output"]>;
  updated_at?: Maybe<Scalars["timestamptz"]["output"]>;
  user_id?: Maybe<Scalars["uuid"]["output"]>;
};

/** order by max() on columns of table "badma.ais" */
export type Badma_Ais_Max_Order_By = {
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Badma_Ais_Min_Fields = {
  __typename?: "badma_ais_min_fields";
  created_at?: Maybe<Scalars["timestamptz"]["output"]>;
  id?: Maybe<Scalars["uuid"]["output"]>;
  updated_at?: Maybe<Scalars["timestamptz"]["output"]>;
  user_id?: Maybe<Scalars["uuid"]["output"]>;
};

/** order by min() on columns of table "badma.ais" */
export type Badma_Ais_Min_Order_By = {
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "badma.ais" */
export type Badma_Ais_Mutation_Response = {
  __typename?: "badma_ais_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"]["output"];
  /** data from the rows affected by the mutation */
  returning: Array<Badma_Ais>;
};

/** on_conflict condition type for table "badma.ais" */
export type Badma_Ais_On_Conflict = {
  constraint: Badma_Ais_Constraint;
  update_columns?: Array<Badma_Ais_Update_Column>;
  where?: InputMaybe<Badma_Ais_Bool_Exp>;
};

/** Ordering options when selecting data from "badma.ais". */
export type Badma_Ais_Order_By = {
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  options?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  user?: InputMaybe<Users_Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** primary key columns input for table: badma.ais */
export type Badma_Ais_Pk_Columns_Input = {
  id: Scalars["uuid"]["input"];
};

/** prepend existing jsonb value of filtered columns with new jsonb value */
export type Badma_Ais_Prepend_Input = {
  options?: InputMaybe<Scalars["jsonb"]["input"]>;
};

/** select columns of table "badma.ais" */
export enum Badma_Ais_Select_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Id = "id",
  /** column name */
  Options = "options",
  /** column name */
  UpdatedAt = "updated_at",
  /** column name */
  UserId = "user_id",
}

/** input type for updating data in table "badma.ais" */
export type Badma_Ais_Set_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  options?: InputMaybe<Scalars["jsonb"]["input"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  user_id?: InputMaybe<Scalars["uuid"]["input"]>;
};

/** Streaming cursor of the table "badma_ais" */
export type Badma_Ais_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Badma_Ais_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Badma_Ais_Stream_Cursor_Value_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  options?: InputMaybe<Scalars["jsonb"]["input"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  user_id?: InputMaybe<Scalars["uuid"]["input"]>;
};

/** update columns of table "badma.ais" */
export enum Badma_Ais_Update_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Id = "id",
  /** column name */
  Options = "options",
  /** column name */
  UpdatedAt = "updated_at",
  /** column name */
  UserId = "user_id",
}

export type Badma_Ais_Updates = {
  /** append existing jsonb value of filtered columns with new jsonb value */
  _append?: InputMaybe<Badma_Ais_Append_Input>;
  /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
  _delete_at_path?: InputMaybe<Badma_Ais_Delete_At_Path_Input>;
  /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
  _delete_elem?: InputMaybe<Badma_Ais_Delete_Elem_Input>;
  /** delete key/value pair or string element. key/value pairs are matched based on their key value */
  _delete_key?: InputMaybe<Badma_Ais_Delete_Key_Input>;
  /** prepend existing jsonb value of filtered columns with new jsonb value */
  _prepend?: InputMaybe<Badma_Ais_Prepend_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Badma_Ais_Set_Input>;
  /** filter the rows which have to be updated */
  where: Badma_Ais_Bool_Exp;
};

/** columns and relationships of "badma.errors" */
export type Badma_Errors = {
  __typename?: "badma_errors";
  context?: Maybe<Scalars["String"]["output"]>;
  created_at: Scalars["timestamptz"]["output"];
  error_message?: Maybe<Scalars["String"]["output"]>;
  /** An object relationship */
  game?: Maybe<Badma_Games>;
  game_id?: Maybe<Scalars["uuid"]["output"]>;
  id: Scalars["uuid"]["output"];
  request_payload?: Maybe<Scalars["jsonb"]["output"]>;
  response_payload?: Maybe<Scalars["jsonb"]["output"]>;
  /** An object relationship */
  user?: Maybe<Users>;
  user_id?: Maybe<Scalars["uuid"]["output"]>;
};

/** columns and relationships of "badma.errors" */
export type Badma_ErrorsRequest_PayloadArgs = {
  path?: InputMaybe<Scalars["String"]["input"]>;
};

/** columns and relationships of "badma.errors" */
export type Badma_ErrorsResponse_PayloadArgs = {
  path?: InputMaybe<Scalars["String"]["input"]>;
};

/** aggregated selection of "badma.errors" */
export type Badma_Errors_Aggregate = {
  __typename?: "badma_errors_aggregate";
  aggregate?: Maybe<Badma_Errors_Aggregate_Fields>;
  nodes: Array<Badma_Errors>;
};

export type Badma_Errors_Aggregate_Bool_Exp = {
  count?: InputMaybe<Badma_Errors_Aggregate_Bool_Exp_Count>;
};

export type Badma_Errors_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Badma_Errors_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]["input"]>;
  filter?: InputMaybe<Badma_Errors_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "badma.errors" */
export type Badma_Errors_Aggregate_Fields = {
  __typename?: "badma_errors_aggregate_fields";
  count: Scalars["Int"]["output"];
  max?: Maybe<Badma_Errors_Max_Fields>;
  min?: Maybe<Badma_Errors_Min_Fields>;
};

/** aggregate fields of "badma.errors" */
export type Badma_Errors_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Badma_Errors_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]["input"]>;
};

/** order by aggregate values of table "badma.errors" */
export type Badma_Errors_Aggregate_Order_By = {
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Badma_Errors_Max_Order_By>;
  min?: InputMaybe<Badma_Errors_Min_Order_By>;
};

/** append existing jsonb value of filtered columns with new jsonb value */
export type Badma_Errors_Append_Input = {
  request_payload?: InputMaybe<Scalars["jsonb"]["input"]>;
  response_payload?: InputMaybe<Scalars["jsonb"]["input"]>;
};

/** input type for inserting array relation for remote table "badma.errors" */
export type Badma_Errors_Arr_Rel_Insert_Input = {
  data: Array<Badma_Errors_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<Badma_Errors_On_Conflict>;
};

/** Boolean expression to filter rows from the table "badma.errors". All fields are combined with a logical 'AND'. */
export type Badma_Errors_Bool_Exp = {
  _and?: InputMaybe<Array<Badma_Errors_Bool_Exp>>;
  _not?: InputMaybe<Badma_Errors_Bool_Exp>;
  _or?: InputMaybe<Array<Badma_Errors_Bool_Exp>>;
  context?: InputMaybe<String_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  error_message?: InputMaybe<String_Comparison_Exp>;
  game?: InputMaybe<Badma_Games_Bool_Exp>;
  game_id?: InputMaybe<Uuid_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  request_payload?: InputMaybe<Jsonb_Comparison_Exp>;
  response_payload?: InputMaybe<Jsonb_Comparison_Exp>;
  user?: InputMaybe<Users_Bool_Exp>;
  user_id?: InputMaybe<Uuid_Comparison_Exp>;
};

/** unique or primary key constraints on table "badma.errors" */
export enum Badma_Errors_Constraint {
  /** unique or primary key constraint on columns "id" */
  ErrorsPkey = "errors_pkey",
}

/** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
export type Badma_Errors_Delete_At_Path_Input = {
  request_payload?: InputMaybe<Array<Scalars["String"]["input"]>>;
  response_payload?: InputMaybe<Array<Scalars["String"]["input"]>>;
};

/** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
export type Badma_Errors_Delete_Elem_Input = {
  request_payload?: InputMaybe<Scalars["Int"]["input"]>;
  response_payload?: InputMaybe<Scalars["Int"]["input"]>;
};

/** delete key/value pair or string element. key/value pairs are matched based on their key value */
export type Badma_Errors_Delete_Key_Input = {
  request_payload?: InputMaybe<Scalars["String"]["input"]>;
  response_payload?: InputMaybe<Scalars["String"]["input"]>;
};

/** input type for inserting data into table "badma.errors" */
export type Badma_Errors_Insert_Input = {
  context?: InputMaybe<Scalars["String"]["input"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  error_message?: InputMaybe<Scalars["String"]["input"]>;
  game?: InputMaybe<Badma_Games_Obj_Rel_Insert_Input>;
  game_id?: InputMaybe<Scalars["uuid"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  request_payload?: InputMaybe<Scalars["jsonb"]["input"]>;
  response_payload?: InputMaybe<Scalars["jsonb"]["input"]>;
  user?: InputMaybe<Users_Obj_Rel_Insert_Input>;
  user_id?: InputMaybe<Scalars["uuid"]["input"]>;
};

/** aggregate max on columns */
export type Badma_Errors_Max_Fields = {
  __typename?: "badma_errors_max_fields";
  context?: Maybe<Scalars["String"]["output"]>;
  created_at?: Maybe<Scalars["timestamptz"]["output"]>;
  error_message?: Maybe<Scalars["String"]["output"]>;
  game_id?: Maybe<Scalars["uuid"]["output"]>;
  id?: Maybe<Scalars["uuid"]["output"]>;
  user_id?: Maybe<Scalars["uuid"]["output"]>;
};

/** order by max() on columns of table "badma.errors" */
export type Badma_Errors_Max_Order_By = {
  context?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  error_message?: InputMaybe<Order_By>;
  game_id?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Badma_Errors_Min_Fields = {
  __typename?: "badma_errors_min_fields";
  context?: Maybe<Scalars["String"]["output"]>;
  created_at?: Maybe<Scalars["timestamptz"]["output"]>;
  error_message?: Maybe<Scalars["String"]["output"]>;
  game_id?: Maybe<Scalars["uuid"]["output"]>;
  id?: Maybe<Scalars["uuid"]["output"]>;
  user_id?: Maybe<Scalars["uuid"]["output"]>;
};

/** order by min() on columns of table "badma.errors" */
export type Badma_Errors_Min_Order_By = {
  context?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  error_message?: InputMaybe<Order_By>;
  game_id?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "badma.errors" */
export type Badma_Errors_Mutation_Response = {
  __typename?: "badma_errors_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"]["output"];
  /** data from the rows affected by the mutation */
  returning: Array<Badma_Errors>;
};

/** on_conflict condition type for table "badma.errors" */
export type Badma_Errors_On_Conflict = {
  constraint: Badma_Errors_Constraint;
  update_columns?: Array<Badma_Errors_Update_Column>;
  where?: InputMaybe<Badma_Errors_Bool_Exp>;
};

/** Ordering options when selecting data from "badma.errors". */
export type Badma_Errors_Order_By = {
  context?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  error_message?: InputMaybe<Order_By>;
  game?: InputMaybe<Badma_Games_Order_By>;
  game_id?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  request_payload?: InputMaybe<Order_By>;
  response_payload?: InputMaybe<Order_By>;
  user?: InputMaybe<Users_Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** primary key columns input for table: badma.errors */
export type Badma_Errors_Pk_Columns_Input = {
  id: Scalars["uuid"]["input"];
};

/** prepend existing jsonb value of filtered columns with new jsonb value */
export type Badma_Errors_Prepend_Input = {
  request_payload?: InputMaybe<Scalars["jsonb"]["input"]>;
  response_payload?: InputMaybe<Scalars["jsonb"]["input"]>;
};

/** select columns of table "badma.errors" */
export enum Badma_Errors_Select_Column {
  /** column name */
  Context = "context",
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  ErrorMessage = "error_message",
  /** column name */
  GameId = "game_id",
  /** column name */
  Id = "id",
  /** column name */
  RequestPayload = "request_payload",
  /** column name */
  ResponsePayload = "response_payload",
  /** column name */
  UserId = "user_id",
}

/** input type for updating data in table "badma.errors" */
export type Badma_Errors_Set_Input = {
  context?: InputMaybe<Scalars["String"]["input"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  error_message?: InputMaybe<Scalars["String"]["input"]>;
  game_id?: InputMaybe<Scalars["uuid"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  request_payload?: InputMaybe<Scalars["jsonb"]["input"]>;
  response_payload?: InputMaybe<Scalars["jsonb"]["input"]>;
  user_id?: InputMaybe<Scalars["uuid"]["input"]>;
};

/** Streaming cursor of the table "badma_errors" */
export type Badma_Errors_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Badma_Errors_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Badma_Errors_Stream_Cursor_Value_Input = {
  context?: InputMaybe<Scalars["String"]["input"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  error_message?: InputMaybe<Scalars["String"]["input"]>;
  game_id?: InputMaybe<Scalars["uuid"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  request_payload?: InputMaybe<Scalars["jsonb"]["input"]>;
  response_payload?: InputMaybe<Scalars["jsonb"]["input"]>;
  user_id?: InputMaybe<Scalars["uuid"]["input"]>;
};

/** update columns of table "badma.errors" */
export enum Badma_Errors_Update_Column {
  /** column name */
  Context = "context",
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  ErrorMessage = "error_message",
  /** column name */
  GameId = "game_id",
  /** column name */
  Id = "id",
  /** column name */
  RequestPayload = "request_payload",
  /** column name */
  ResponsePayload = "response_payload",
  /** column name */
  UserId = "user_id",
}

export type Badma_Errors_Updates = {
  /** append existing jsonb value of filtered columns with new jsonb value */
  _append?: InputMaybe<Badma_Errors_Append_Input>;
  /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
  _delete_at_path?: InputMaybe<Badma_Errors_Delete_At_Path_Input>;
  /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
  _delete_elem?: InputMaybe<Badma_Errors_Delete_Elem_Input>;
  /** delete key/value pair or string element. key/value pairs are matched based on their key value */
  _delete_key?: InputMaybe<Badma_Errors_Delete_Key_Input>;
  /** prepend existing jsonb value of filtered columns with new jsonb value */
  _prepend?: InputMaybe<Badma_Errors_Prepend_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Badma_Errors_Set_Input>;
  /** filter the rows which have to be updated */
  where: Badma_Errors_Bool_Exp;
};

/** columns and relationships of "badma.games" */
export type Badma_Games = {
  __typename?: "badma_games";
  created_at: Scalars["timestamptz"]["output"];
  /** An array relationship */
  errors: Array<Badma_Errors>;
  /** An aggregate relationship */
  errors_aggregate: Badma_Errors_Aggregate;
  fen?: Maybe<Scalars["String"]["output"]>;
  id: Scalars["uuid"]["output"];
  /** An array relationship */
  joins: Array<Badma_Joins>;
  /** An aggregate relationship */
  joins_aggregate: Badma_Joins_Aggregate;
  mode: Scalars["String"]["output"];
  /** An array relationship */
  moves: Array<Badma_Moves>;
  /** An aggregate relationship */
  moves_aggregate: Badma_Moves_Aggregate;
  side: Scalars["Int"]["output"];
  sides: Scalars["Int"]["output"];
  status: Scalars["String"]["output"];
  storage_inserted_at: Scalars["timestamptz"]["output"];
  storage_updated_at: Scalars["timestamptz"]["output"];
  /** An array relationship */
  tournament_games: Array<Badma_Tournament_Games>;
  /** An aggregate relationship */
  tournament_games_aggregate: Badma_Tournament_Games_Aggregate;
  updated_at: Scalars["timestamptz"]["output"];
  /** An object relationship */
  user: Users;
  user_id: Scalars["uuid"]["output"];
};

/** columns and relationships of "badma.games" */
export type Badma_GamesErrorsArgs = {
  distinct_on?: InputMaybe<Array<Badma_Errors_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Errors_Order_By>>;
  where?: InputMaybe<Badma_Errors_Bool_Exp>;
};

/** columns and relationships of "badma.games" */
export type Badma_GamesErrors_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Badma_Errors_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Errors_Order_By>>;
  where?: InputMaybe<Badma_Errors_Bool_Exp>;
};

/** columns and relationships of "badma.games" */
export type Badma_GamesJoinsArgs = {
  distinct_on?: InputMaybe<Array<Badma_Joins_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Joins_Order_By>>;
  where?: InputMaybe<Badma_Joins_Bool_Exp>;
};

/** columns and relationships of "badma.games" */
export type Badma_GamesJoins_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Badma_Joins_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Joins_Order_By>>;
  where?: InputMaybe<Badma_Joins_Bool_Exp>;
};

/** columns and relationships of "badma.games" */
export type Badma_GamesMovesArgs = {
  distinct_on?: InputMaybe<Array<Badma_Moves_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Moves_Order_By>>;
  where?: InputMaybe<Badma_Moves_Bool_Exp>;
};

/** columns and relationships of "badma.games" */
export type Badma_GamesMoves_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Badma_Moves_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Moves_Order_By>>;
  where?: InputMaybe<Badma_Moves_Bool_Exp>;
};

/** columns and relationships of "badma.games" */
export type Badma_GamesTournament_GamesArgs = {
  distinct_on?: InputMaybe<Array<Badma_Tournament_Games_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Tournament_Games_Order_By>>;
  where?: InputMaybe<Badma_Tournament_Games_Bool_Exp>;
};

/** columns and relationships of "badma.games" */
export type Badma_GamesTournament_Games_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Badma_Tournament_Games_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Tournament_Games_Order_By>>;
  where?: InputMaybe<Badma_Tournament_Games_Bool_Exp>;
};

/** aggregated selection of "badma.games" */
export type Badma_Games_Aggregate = {
  __typename?: "badma_games_aggregate";
  aggregate?: Maybe<Badma_Games_Aggregate_Fields>;
  nodes: Array<Badma_Games>;
};

export type Badma_Games_Aggregate_Bool_Exp = {
  count?: InputMaybe<Badma_Games_Aggregate_Bool_Exp_Count>;
};

export type Badma_Games_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Badma_Games_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]["input"]>;
  filter?: InputMaybe<Badma_Games_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "badma.games" */
export type Badma_Games_Aggregate_Fields = {
  __typename?: "badma_games_aggregate_fields";
  avg?: Maybe<Badma_Games_Avg_Fields>;
  count: Scalars["Int"]["output"];
  max?: Maybe<Badma_Games_Max_Fields>;
  min?: Maybe<Badma_Games_Min_Fields>;
  stddev?: Maybe<Badma_Games_Stddev_Fields>;
  stddev_pop?: Maybe<Badma_Games_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Badma_Games_Stddev_Samp_Fields>;
  sum?: Maybe<Badma_Games_Sum_Fields>;
  var_pop?: Maybe<Badma_Games_Var_Pop_Fields>;
  var_samp?: Maybe<Badma_Games_Var_Samp_Fields>;
  variance?: Maybe<Badma_Games_Variance_Fields>;
};

/** aggregate fields of "badma.games" */
export type Badma_Games_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Badma_Games_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]["input"]>;
};

/** order by aggregate values of table "badma.games" */
export type Badma_Games_Aggregate_Order_By = {
  avg?: InputMaybe<Badma_Games_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Badma_Games_Max_Order_By>;
  min?: InputMaybe<Badma_Games_Min_Order_By>;
  stddev?: InputMaybe<Badma_Games_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Badma_Games_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Badma_Games_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Badma_Games_Sum_Order_By>;
  var_pop?: InputMaybe<Badma_Games_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Badma_Games_Var_Samp_Order_By>;
  variance?: InputMaybe<Badma_Games_Variance_Order_By>;
};

/** input type for inserting array relation for remote table "badma.games" */
export type Badma_Games_Arr_Rel_Insert_Input = {
  data: Array<Badma_Games_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<Badma_Games_On_Conflict>;
};

/** aggregate avg on columns */
export type Badma_Games_Avg_Fields = {
  __typename?: "badma_games_avg_fields";
  side?: Maybe<Scalars["Float"]["output"]>;
  sides?: Maybe<Scalars["Float"]["output"]>;
};

/** order by avg() on columns of table "badma.games" */
export type Badma_Games_Avg_Order_By = {
  side?: InputMaybe<Order_By>;
  sides?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "badma.games". All fields are combined with a logical 'AND'. */
export type Badma_Games_Bool_Exp = {
  _and?: InputMaybe<Array<Badma_Games_Bool_Exp>>;
  _not?: InputMaybe<Badma_Games_Bool_Exp>;
  _or?: InputMaybe<Array<Badma_Games_Bool_Exp>>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  errors?: InputMaybe<Badma_Errors_Bool_Exp>;
  errors_aggregate?: InputMaybe<Badma_Errors_Aggregate_Bool_Exp>;
  fen?: InputMaybe<String_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  joins?: InputMaybe<Badma_Joins_Bool_Exp>;
  joins_aggregate?: InputMaybe<Badma_Joins_Aggregate_Bool_Exp>;
  mode?: InputMaybe<String_Comparison_Exp>;
  moves?: InputMaybe<Badma_Moves_Bool_Exp>;
  moves_aggregate?: InputMaybe<Badma_Moves_Aggregate_Bool_Exp>;
  side?: InputMaybe<Int_Comparison_Exp>;
  sides?: InputMaybe<Int_Comparison_Exp>;
  status?: InputMaybe<String_Comparison_Exp>;
  storage_inserted_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  storage_updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  tournament_games?: InputMaybe<Badma_Tournament_Games_Bool_Exp>;
  tournament_games_aggregate?: InputMaybe<Badma_Tournament_Games_Aggregate_Bool_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  user?: InputMaybe<Users_Bool_Exp>;
  user_id?: InputMaybe<Uuid_Comparison_Exp>;
};

/** unique or primary key constraints on table "badma.games" */
export enum Badma_Games_Constraint {
  /** unique or primary key constraint on columns "id" */
  GamesPkey = "games_pkey",
}

/** input type for incrementing numeric columns in table "badma.games" */
export type Badma_Games_Inc_Input = {
  side?: InputMaybe<Scalars["Int"]["input"]>;
  sides?: InputMaybe<Scalars["Int"]["input"]>;
};

/** input type for inserting data into table "badma.games" */
export type Badma_Games_Insert_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  errors?: InputMaybe<Badma_Errors_Arr_Rel_Insert_Input>;
  fen?: InputMaybe<Scalars["String"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  joins?: InputMaybe<Badma_Joins_Arr_Rel_Insert_Input>;
  mode?: InputMaybe<Scalars["String"]["input"]>;
  moves?: InputMaybe<Badma_Moves_Arr_Rel_Insert_Input>;
  side?: InputMaybe<Scalars["Int"]["input"]>;
  sides?: InputMaybe<Scalars["Int"]["input"]>;
  status?: InputMaybe<Scalars["String"]["input"]>;
  storage_inserted_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  storage_updated_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  tournament_games?: InputMaybe<Badma_Tournament_Games_Arr_Rel_Insert_Input>;
  updated_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  user?: InputMaybe<Users_Obj_Rel_Insert_Input>;
  user_id?: InputMaybe<Scalars["uuid"]["input"]>;
};

/** aggregate max on columns */
export type Badma_Games_Max_Fields = {
  __typename?: "badma_games_max_fields";
  created_at?: Maybe<Scalars["timestamptz"]["output"]>;
  fen?: Maybe<Scalars["String"]["output"]>;
  id?: Maybe<Scalars["uuid"]["output"]>;
  mode?: Maybe<Scalars["String"]["output"]>;
  side?: Maybe<Scalars["Int"]["output"]>;
  sides?: Maybe<Scalars["Int"]["output"]>;
  status?: Maybe<Scalars["String"]["output"]>;
  storage_inserted_at?: Maybe<Scalars["timestamptz"]["output"]>;
  storage_updated_at?: Maybe<Scalars["timestamptz"]["output"]>;
  updated_at?: Maybe<Scalars["timestamptz"]["output"]>;
  user_id?: Maybe<Scalars["uuid"]["output"]>;
};

/** order by max() on columns of table "badma.games" */
export type Badma_Games_Max_Order_By = {
  created_at?: InputMaybe<Order_By>;
  fen?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  mode?: InputMaybe<Order_By>;
  side?: InputMaybe<Order_By>;
  sides?: InputMaybe<Order_By>;
  status?: InputMaybe<Order_By>;
  storage_inserted_at?: InputMaybe<Order_By>;
  storage_updated_at?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Badma_Games_Min_Fields = {
  __typename?: "badma_games_min_fields";
  created_at?: Maybe<Scalars["timestamptz"]["output"]>;
  fen?: Maybe<Scalars["String"]["output"]>;
  id?: Maybe<Scalars["uuid"]["output"]>;
  mode?: Maybe<Scalars["String"]["output"]>;
  side?: Maybe<Scalars["Int"]["output"]>;
  sides?: Maybe<Scalars["Int"]["output"]>;
  status?: Maybe<Scalars["String"]["output"]>;
  storage_inserted_at?: Maybe<Scalars["timestamptz"]["output"]>;
  storage_updated_at?: Maybe<Scalars["timestamptz"]["output"]>;
  updated_at?: Maybe<Scalars["timestamptz"]["output"]>;
  user_id?: Maybe<Scalars["uuid"]["output"]>;
};

/** order by min() on columns of table "badma.games" */
export type Badma_Games_Min_Order_By = {
  created_at?: InputMaybe<Order_By>;
  fen?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  mode?: InputMaybe<Order_By>;
  side?: InputMaybe<Order_By>;
  sides?: InputMaybe<Order_By>;
  status?: InputMaybe<Order_By>;
  storage_inserted_at?: InputMaybe<Order_By>;
  storage_updated_at?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "badma.games" */
export type Badma_Games_Mutation_Response = {
  __typename?: "badma_games_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"]["output"];
  /** data from the rows affected by the mutation */
  returning: Array<Badma_Games>;
};

/** input type for inserting object relation for remote table "badma.games" */
export type Badma_Games_Obj_Rel_Insert_Input = {
  data: Badma_Games_Insert_Input;
  /** upsert condition */
  on_conflict?: InputMaybe<Badma_Games_On_Conflict>;
};

/** on_conflict condition type for table "badma.games" */
export type Badma_Games_On_Conflict = {
  constraint: Badma_Games_Constraint;
  update_columns?: Array<Badma_Games_Update_Column>;
  where?: InputMaybe<Badma_Games_Bool_Exp>;
};

/** Ordering options when selecting data from "badma.games". */
export type Badma_Games_Order_By = {
  created_at?: InputMaybe<Order_By>;
  errors_aggregate?: InputMaybe<Badma_Errors_Aggregate_Order_By>;
  fen?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  joins_aggregate?: InputMaybe<Badma_Joins_Aggregate_Order_By>;
  mode?: InputMaybe<Order_By>;
  moves_aggregate?: InputMaybe<Badma_Moves_Aggregate_Order_By>;
  side?: InputMaybe<Order_By>;
  sides?: InputMaybe<Order_By>;
  status?: InputMaybe<Order_By>;
  storage_inserted_at?: InputMaybe<Order_By>;
  storage_updated_at?: InputMaybe<Order_By>;
  tournament_games_aggregate?: InputMaybe<Badma_Tournament_Games_Aggregate_Order_By>;
  updated_at?: InputMaybe<Order_By>;
  user?: InputMaybe<Users_Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** primary key columns input for table: badma.games */
export type Badma_Games_Pk_Columns_Input = {
  id: Scalars["uuid"]["input"];
};

/** select columns of table "badma.games" */
export enum Badma_Games_Select_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Fen = "fen",
  /** column name */
  Id = "id",
  /** column name */
  Mode = "mode",
  /** column name */
  Side = "side",
  /** column name */
  Sides = "sides",
  /** column name */
  Status = "status",
  /** column name */
  StorageInsertedAt = "storage_inserted_at",
  /** column name */
  StorageUpdatedAt = "storage_updated_at",
  /** column name */
  UpdatedAt = "updated_at",
  /** column name */
  UserId = "user_id",
}

/** input type for updating data in table "badma.games" */
export type Badma_Games_Set_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  fen?: InputMaybe<Scalars["String"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  mode?: InputMaybe<Scalars["String"]["input"]>;
  side?: InputMaybe<Scalars["Int"]["input"]>;
  sides?: InputMaybe<Scalars["Int"]["input"]>;
  status?: InputMaybe<Scalars["String"]["input"]>;
  storage_inserted_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  storage_updated_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  user_id?: InputMaybe<Scalars["uuid"]["input"]>;
};

/** aggregate stddev on columns */
export type Badma_Games_Stddev_Fields = {
  __typename?: "badma_games_stddev_fields";
  side?: Maybe<Scalars["Float"]["output"]>;
  sides?: Maybe<Scalars["Float"]["output"]>;
};

/** order by stddev() on columns of table "badma.games" */
export type Badma_Games_Stddev_Order_By = {
  side?: InputMaybe<Order_By>;
  sides?: InputMaybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Badma_Games_Stddev_Pop_Fields = {
  __typename?: "badma_games_stddev_pop_fields";
  side?: Maybe<Scalars["Float"]["output"]>;
  sides?: Maybe<Scalars["Float"]["output"]>;
};

/** order by stddev_pop() on columns of table "badma.games" */
export type Badma_Games_Stddev_Pop_Order_By = {
  side?: InputMaybe<Order_By>;
  sides?: InputMaybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Badma_Games_Stddev_Samp_Fields = {
  __typename?: "badma_games_stddev_samp_fields";
  side?: Maybe<Scalars["Float"]["output"]>;
  sides?: Maybe<Scalars["Float"]["output"]>;
};

/** order by stddev_samp() on columns of table "badma.games" */
export type Badma_Games_Stddev_Samp_Order_By = {
  side?: InputMaybe<Order_By>;
  sides?: InputMaybe<Order_By>;
};

/** Streaming cursor of the table "badma_games" */
export type Badma_Games_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Badma_Games_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Badma_Games_Stream_Cursor_Value_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  fen?: InputMaybe<Scalars["String"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  mode?: InputMaybe<Scalars["String"]["input"]>;
  side?: InputMaybe<Scalars["Int"]["input"]>;
  sides?: InputMaybe<Scalars["Int"]["input"]>;
  status?: InputMaybe<Scalars["String"]["input"]>;
  storage_inserted_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  storage_updated_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  user_id?: InputMaybe<Scalars["uuid"]["input"]>;
};

/** aggregate sum on columns */
export type Badma_Games_Sum_Fields = {
  __typename?: "badma_games_sum_fields";
  side?: Maybe<Scalars["Int"]["output"]>;
  sides?: Maybe<Scalars["Int"]["output"]>;
};

/** order by sum() on columns of table "badma.games" */
export type Badma_Games_Sum_Order_By = {
  side?: InputMaybe<Order_By>;
  sides?: InputMaybe<Order_By>;
};

/** update columns of table "badma.games" */
export enum Badma_Games_Update_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Fen = "fen",
  /** column name */
  Id = "id",
  /** column name */
  Mode = "mode",
  /** column name */
  Side = "side",
  /** column name */
  Sides = "sides",
  /** column name */
  Status = "status",
  /** column name */
  StorageInsertedAt = "storage_inserted_at",
  /** column name */
  StorageUpdatedAt = "storage_updated_at",
  /** column name */
  UpdatedAt = "updated_at",
  /** column name */
  UserId = "user_id",
}

export type Badma_Games_Updates = {
  /** increments the numeric columns with given value of the filtered values */
  _inc?: InputMaybe<Badma_Games_Inc_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Badma_Games_Set_Input>;
  /** filter the rows which have to be updated */
  where: Badma_Games_Bool_Exp;
};

/** aggregate var_pop on columns */
export type Badma_Games_Var_Pop_Fields = {
  __typename?: "badma_games_var_pop_fields";
  side?: Maybe<Scalars["Float"]["output"]>;
  sides?: Maybe<Scalars["Float"]["output"]>;
};

/** order by var_pop() on columns of table "badma.games" */
export type Badma_Games_Var_Pop_Order_By = {
  side?: InputMaybe<Order_By>;
  sides?: InputMaybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Badma_Games_Var_Samp_Fields = {
  __typename?: "badma_games_var_samp_fields";
  side?: Maybe<Scalars["Float"]["output"]>;
  sides?: Maybe<Scalars["Float"]["output"]>;
};

/** order by var_samp() on columns of table "badma.games" */
export type Badma_Games_Var_Samp_Order_By = {
  side?: InputMaybe<Order_By>;
  sides?: InputMaybe<Order_By>;
};

/** aggregate variance on columns */
export type Badma_Games_Variance_Fields = {
  __typename?: "badma_games_variance_fields";
  side?: Maybe<Scalars["Float"]["output"]>;
  sides?: Maybe<Scalars["Float"]["output"]>;
};

/** order by variance() on columns of table "badma.games" */
export type Badma_Games_Variance_Order_By = {
  side?: InputMaybe<Order_By>;
  sides?: InputMaybe<Order_By>;
};

/** columns and relationships of "badma.joins" */
export type Badma_Joins = {
  __typename?: "badma_joins";
  client_id?: Maybe<Scalars["uuid"]["output"]>;
  created_at: Scalars["timestamptz"]["output"];
  /** An object relationship */
  game: Badma_Games;
  game_id: Scalars["uuid"]["output"];
  id: Scalars["uuid"]["output"];
  role: Scalars["Int"]["output"];
  side: Scalars["Int"]["output"];
  /** An object relationship */
  user: Users;
  user_id: Scalars["uuid"]["output"];
};

/** aggregated selection of "badma.joins" */
export type Badma_Joins_Aggregate = {
  __typename?: "badma_joins_aggregate";
  aggregate?: Maybe<Badma_Joins_Aggregate_Fields>;
  nodes: Array<Badma_Joins>;
};

export type Badma_Joins_Aggregate_Bool_Exp = {
  count?: InputMaybe<Badma_Joins_Aggregate_Bool_Exp_Count>;
};

export type Badma_Joins_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Badma_Joins_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]["input"]>;
  filter?: InputMaybe<Badma_Joins_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "badma.joins" */
export type Badma_Joins_Aggregate_Fields = {
  __typename?: "badma_joins_aggregate_fields";
  avg?: Maybe<Badma_Joins_Avg_Fields>;
  count: Scalars["Int"]["output"];
  max?: Maybe<Badma_Joins_Max_Fields>;
  min?: Maybe<Badma_Joins_Min_Fields>;
  stddev?: Maybe<Badma_Joins_Stddev_Fields>;
  stddev_pop?: Maybe<Badma_Joins_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Badma_Joins_Stddev_Samp_Fields>;
  sum?: Maybe<Badma_Joins_Sum_Fields>;
  var_pop?: Maybe<Badma_Joins_Var_Pop_Fields>;
  var_samp?: Maybe<Badma_Joins_Var_Samp_Fields>;
  variance?: Maybe<Badma_Joins_Variance_Fields>;
};

/** aggregate fields of "badma.joins" */
export type Badma_Joins_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Badma_Joins_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]["input"]>;
};

/** order by aggregate values of table "badma.joins" */
export type Badma_Joins_Aggregate_Order_By = {
  avg?: InputMaybe<Badma_Joins_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Badma_Joins_Max_Order_By>;
  min?: InputMaybe<Badma_Joins_Min_Order_By>;
  stddev?: InputMaybe<Badma_Joins_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Badma_Joins_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Badma_Joins_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Badma_Joins_Sum_Order_By>;
  var_pop?: InputMaybe<Badma_Joins_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Badma_Joins_Var_Samp_Order_By>;
  variance?: InputMaybe<Badma_Joins_Variance_Order_By>;
};

/** input type for inserting array relation for remote table "badma.joins" */
export type Badma_Joins_Arr_Rel_Insert_Input = {
  data: Array<Badma_Joins_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<Badma_Joins_On_Conflict>;
};

/** aggregate avg on columns */
export type Badma_Joins_Avg_Fields = {
  __typename?: "badma_joins_avg_fields";
  role?: Maybe<Scalars["Float"]["output"]>;
  side?: Maybe<Scalars["Float"]["output"]>;
};

/** order by avg() on columns of table "badma.joins" */
export type Badma_Joins_Avg_Order_By = {
  role?: InputMaybe<Order_By>;
  side?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "badma.joins". All fields are combined with a logical 'AND'. */
export type Badma_Joins_Bool_Exp = {
  _and?: InputMaybe<Array<Badma_Joins_Bool_Exp>>;
  _not?: InputMaybe<Badma_Joins_Bool_Exp>;
  _or?: InputMaybe<Array<Badma_Joins_Bool_Exp>>;
  client_id?: InputMaybe<Uuid_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  game?: InputMaybe<Badma_Games_Bool_Exp>;
  game_id?: InputMaybe<Uuid_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  role?: InputMaybe<Int_Comparison_Exp>;
  side?: InputMaybe<Int_Comparison_Exp>;
  user?: InputMaybe<Users_Bool_Exp>;
  user_id?: InputMaybe<Uuid_Comparison_Exp>;
};

/** unique or primary key constraints on table "badma.joins" */
export enum Badma_Joins_Constraint {
  /** unique or primary key constraint on columns "id" */
  JoinsPkey = "joins_pkey",
}

/** input type for incrementing numeric columns in table "badma.joins" */
export type Badma_Joins_Inc_Input = {
  role?: InputMaybe<Scalars["Int"]["input"]>;
  side?: InputMaybe<Scalars["Int"]["input"]>;
};

/** input type for inserting data into table "badma.joins" */
export type Badma_Joins_Insert_Input = {
  client_id?: InputMaybe<Scalars["uuid"]["input"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  game?: InputMaybe<Badma_Games_Obj_Rel_Insert_Input>;
  game_id?: InputMaybe<Scalars["uuid"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  role?: InputMaybe<Scalars["Int"]["input"]>;
  side?: InputMaybe<Scalars["Int"]["input"]>;
  user?: InputMaybe<Users_Obj_Rel_Insert_Input>;
  user_id?: InputMaybe<Scalars["uuid"]["input"]>;
};

/** aggregate max on columns */
export type Badma_Joins_Max_Fields = {
  __typename?: "badma_joins_max_fields";
  client_id?: Maybe<Scalars["uuid"]["output"]>;
  created_at?: Maybe<Scalars["timestamptz"]["output"]>;
  game_id?: Maybe<Scalars["uuid"]["output"]>;
  id?: Maybe<Scalars["uuid"]["output"]>;
  role?: Maybe<Scalars["Int"]["output"]>;
  side?: Maybe<Scalars["Int"]["output"]>;
  user_id?: Maybe<Scalars["uuid"]["output"]>;
};

/** order by max() on columns of table "badma.joins" */
export type Badma_Joins_Max_Order_By = {
  client_id?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  game_id?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  role?: InputMaybe<Order_By>;
  side?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Badma_Joins_Min_Fields = {
  __typename?: "badma_joins_min_fields";
  client_id?: Maybe<Scalars["uuid"]["output"]>;
  created_at?: Maybe<Scalars["timestamptz"]["output"]>;
  game_id?: Maybe<Scalars["uuid"]["output"]>;
  id?: Maybe<Scalars["uuid"]["output"]>;
  role?: Maybe<Scalars["Int"]["output"]>;
  side?: Maybe<Scalars["Int"]["output"]>;
  user_id?: Maybe<Scalars["uuid"]["output"]>;
};

/** order by min() on columns of table "badma.joins" */
export type Badma_Joins_Min_Order_By = {
  client_id?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  game_id?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  role?: InputMaybe<Order_By>;
  side?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "badma.joins" */
export type Badma_Joins_Mutation_Response = {
  __typename?: "badma_joins_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"]["output"];
  /** data from the rows affected by the mutation */
  returning: Array<Badma_Joins>;
};

/** on_conflict condition type for table "badma.joins" */
export type Badma_Joins_On_Conflict = {
  constraint: Badma_Joins_Constraint;
  update_columns?: Array<Badma_Joins_Update_Column>;
  where?: InputMaybe<Badma_Joins_Bool_Exp>;
};

/** Ordering options when selecting data from "badma.joins". */
export type Badma_Joins_Order_By = {
  client_id?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  game?: InputMaybe<Badma_Games_Order_By>;
  game_id?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  role?: InputMaybe<Order_By>;
  side?: InputMaybe<Order_By>;
  user?: InputMaybe<Users_Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** primary key columns input for table: badma.joins */
export type Badma_Joins_Pk_Columns_Input = {
  id: Scalars["uuid"]["input"];
};

/** select columns of table "badma.joins" */
export enum Badma_Joins_Select_Column {
  /** column name */
  ClientId = "client_id",
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  GameId = "game_id",
  /** column name */
  Id = "id",
  /** column name */
  Role = "role",
  /** column name */
  Side = "side",
  /** column name */
  UserId = "user_id",
}

/** input type for updating data in table "badma.joins" */
export type Badma_Joins_Set_Input = {
  client_id?: InputMaybe<Scalars["uuid"]["input"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  game_id?: InputMaybe<Scalars["uuid"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  role?: InputMaybe<Scalars["Int"]["input"]>;
  side?: InputMaybe<Scalars["Int"]["input"]>;
  user_id?: InputMaybe<Scalars["uuid"]["input"]>;
};

/** aggregate stddev on columns */
export type Badma_Joins_Stddev_Fields = {
  __typename?: "badma_joins_stddev_fields";
  role?: Maybe<Scalars["Float"]["output"]>;
  side?: Maybe<Scalars["Float"]["output"]>;
};

/** order by stddev() on columns of table "badma.joins" */
export type Badma_Joins_Stddev_Order_By = {
  role?: InputMaybe<Order_By>;
  side?: InputMaybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Badma_Joins_Stddev_Pop_Fields = {
  __typename?: "badma_joins_stddev_pop_fields";
  role?: Maybe<Scalars["Float"]["output"]>;
  side?: Maybe<Scalars["Float"]["output"]>;
};

/** order by stddev_pop() on columns of table "badma.joins" */
export type Badma_Joins_Stddev_Pop_Order_By = {
  role?: InputMaybe<Order_By>;
  side?: InputMaybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Badma_Joins_Stddev_Samp_Fields = {
  __typename?: "badma_joins_stddev_samp_fields";
  role?: Maybe<Scalars["Float"]["output"]>;
  side?: Maybe<Scalars["Float"]["output"]>;
};

/** order by stddev_samp() on columns of table "badma.joins" */
export type Badma_Joins_Stddev_Samp_Order_By = {
  role?: InputMaybe<Order_By>;
  side?: InputMaybe<Order_By>;
};

/** Streaming cursor of the table "badma_joins" */
export type Badma_Joins_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Badma_Joins_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Badma_Joins_Stream_Cursor_Value_Input = {
  client_id?: InputMaybe<Scalars["uuid"]["input"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  game_id?: InputMaybe<Scalars["uuid"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  role?: InputMaybe<Scalars["Int"]["input"]>;
  side?: InputMaybe<Scalars["Int"]["input"]>;
  user_id?: InputMaybe<Scalars["uuid"]["input"]>;
};

/** aggregate sum on columns */
export type Badma_Joins_Sum_Fields = {
  __typename?: "badma_joins_sum_fields";
  role?: Maybe<Scalars["Int"]["output"]>;
  side?: Maybe<Scalars["Int"]["output"]>;
};

/** order by sum() on columns of table "badma.joins" */
export type Badma_Joins_Sum_Order_By = {
  role?: InputMaybe<Order_By>;
  side?: InputMaybe<Order_By>;
};

/** update columns of table "badma.joins" */
export enum Badma_Joins_Update_Column {
  /** column name */
  ClientId = "client_id",
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  GameId = "game_id",
  /** column name */
  Id = "id",
  /** column name */
  Role = "role",
  /** column name */
  Side = "side",
  /** column name */
  UserId = "user_id",
}

export type Badma_Joins_Updates = {
  /** increments the numeric columns with given value of the filtered values */
  _inc?: InputMaybe<Badma_Joins_Inc_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Badma_Joins_Set_Input>;
  /** filter the rows which have to be updated */
  where: Badma_Joins_Bool_Exp;
};

/** aggregate var_pop on columns */
export type Badma_Joins_Var_Pop_Fields = {
  __typename?: "badma_joins_var_pop_fields";
  role?: Maybe<Scalars["Float"]["output"]>;
  side?: Maybe<Scalars["Float"]["output"]>;
};

/** order by var_pop() on columns of table "badma.joins" */
export type Badma_Joins_Var_Pop_Order_By = {
  role?: InputMaybe<Order_By>;
  side?: InputMaybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Badma_Joins_Var_Samp_Fields = {
  __typename?: "badma_joins_var_samp_fields";
  role?: Maybe<Scalars["Float"]["output"]>;
  side?: Maybe<Scalars["Float"]["output"]>;
};

/** order by var_samp() on columns of table "badma.joins" */
export type Badma_Joins_Var_Samp_Order_By = {
  role?: InputMaybe<Order_By>;
  side?: InputMaybe<Order_By>;
};

/** aggregate variance on columns */
export type Badma_Joins_Variance_Fields = {
  __typename?: "badma_joins_variance_fields";
  role?: Maybe<Scalars["Float"]["output"]>;
  side?: Maybe<Scalars["Float"]["output"]>;
};

/** order by variance() on columns of table "badma.joins" */
export type Badma_Joins_Variance_Order_By = {
  role?: InputMaybe<Order_By>;
  side?: InputMaybe<Order_By>;
};

/** columns and relationships of "badma.moves" */
export type Badma_Moves = {
  __typename?: "badma_moves";
  created_at: Scalars["timestamptz"]["output"];
  from?: Maybe<Scalars["String"]["output"]>;
  /** An object relationship */
  game: Badma_Games;
  game_id: Scalars["uuid"]["output"];
  id: Scalars["uuid"]["output"];
  promotion?: Maybe<Scalars["String"]["output"]>;
  side?: Maybe<Scalars["Int"]["output"]>;
  to?: Maybe<Scalars["String"]["output"]>;
  type?: Maybe<Scalars["String"]["output"]>;
  /** An object relationship */
  user: Users;
  user_id: Scalars["uuid"]["output"];
};

/** aggregated selection of "badma.moves" */
export type Badma_Moves_Aggregate = {
  __typename?: "badma_moves_aggregate";
  aggregate?: Maybe<Badma_Moves_Aggregate_Fields>;
  nodes: Array<Badma_Moves>;
};

export type Badma_Moves_Aggregate_Bool_Exp = {
  count?: InputMaybe<Badma_Moves_Aggregate_Bool_Exp_Count>;
};

export type Badma_Moves_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Badma_Moves_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]["input"]>;
  filter?: InputMaybe<Badma_Moves_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "badma.moves" */
export type Badma_Moves_Aggregate_Fields = {
  __typename?: "badma_moves_aggregate_fields";
  avg?: Maybe<Badma_Moves_Avg_Fields>;
  count: Scalars["Int"]["output"];
  max?: Maybe<Badma_Moves_Max_Fields>;
  min?: Maybe<Badma_Moves_Min_Fields>;
  stddev?: Maybe<Badma_Moves_Stddev_Fields>;
  stddev_pop?: Maybe<Badma_Moves_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Badma_Moves_Stddev_Samp_Fields>;
  sum?: Maybe<Badma_Moves_Sum_Fields>;
  var_pop?: Maybe<Badma_Moves_Var_Pop_Fields>;
  var_samp?: Maybe<Badma_Moves_Var_Samp_Fields>;
  variance?: Maybe<Badma_Moves_Variance_Fields>;
};

/** aggregate fields of "badma.moves" */
export type Badma_Moves_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Badma_Moves_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]["input"]>;
};

/** order by aggregate values of table "badma.moves" */
export type Badma_Moves_Aggregate_Order_By = {
  avg?: InputMaybe<Badma_Moves_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Badma_Moves_Max_Order_By>;
  min?: InputMaybe<Badma_Moves_Min_Order_By>;
  stddev?: InputMaybe<Badma_Moves_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Badma_Moves_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Badma_Moves_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Badma_Moves_Sum_Order_By>;
  var_pop?: InputMaybe<Badma_Moves_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Badma_Moves_Var_Samp_Order_By>;
  variance?: InputMaybe<Badma_Moves_Variance_Order_By>;
};

/** input type for inserting array relation for remote table "badma.moves" */
export type Badma_Moves_Arr_Rel_Insert_Input = {
  data: Array<Badma_Moves_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<Badma_Moves_On_Conflict>;
};

/** aggregate avg on columns */
export type Badma_Moves_Avg_Fields = {
  __typename?: "badma_moves_avg_fields";
  side?: Maybe<Scalars["Float"]["output"]>;
};

/** order by avg() on columns of table "badma.moves" */
export type Badma_Moves_Avg_Order_By = {
  side?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "badma.moves". All fields are combined with a logical 'AND'. */
export type Badma_Moves_Bool_Exp = {
  _and?: InputMaybe<Array<Badma_Moves_Bool_Exp>>;
  _not?: InputMaybe<Badma_Moves_Bool_Exp>;
  _or?: InputMaybe<Array<Badma_Moves_Bool_Exp>>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  from?: InputMaybe<String_Comparison_Exp>;
  game?: InputMaybe<Badma_Games_Bool_Exp>;
  game_id?: InputMaybe<Uuid_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  promotion?: InputMaybe<String_Comparison_Exp>;
  side?: InputMaybe<Int_Comparison_Exp>;
  to?: InputMaybe<String_Comparison_Exp>;
  type?: InputMaybe<String_Comparison_Exp>;
  user?: InputMaybe<Users_Bool_Exp>;
  user_id?: InputMaybe<Uuid_Comparison_Exp>;
};

/** unique or primary key constraints on table "badma.moves" */
export enum Badma_Moves_Constraint {
  /** unique or primary key constraint on columns "id" */
  MovesPkey = "moves_pkey",
}

/** input type for incrementing numeric columns in table "badma.moves" */
export type Badma_Moves_Inc_Input = {
  side?: InputMaybe<Scalars["Int"]["input"]>;
};

/** input type for inserting data into table "badma.moves" */
export type Badma_Moves_Insert_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  from?: InputMaybe<Scalars["String"]["input"]>;
  game?: InputMaybe<Badma_Games_Obj_Rel_Insert_Input>;
  game_id?: InputMaybe<Scalars["uuid"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  promotion?: InputMaybe<Scalars["String"]["input"]>;
  side?: InputMaybe<Scalars["Int"]["input"]>;
  to?: InputMaybe<Scalars["String"]["input"]>;
  type?: InputMaybe<Scalars["String"]["input"]>;
  user?: InputMaybe<Users_Obj_Rel_Insert_Input>;
  user_id?: InputMaybe<Scalars["uuid"]["input"]>;
};

/** aggregate max on columns */
export type Badma_Moves_Max_Fields = {
  __typename?: "badma_moves_max_fields";
  created_at?: Maybe<Scalars["timestamptz"]["output"]>;
  from?: Maybe<Scalars["String"]["output"]>;
  game_id?: Maybe<Scalars["uuid"]["output"]>;
  id?: Maybe<Scalars["uuid"]["output"]>;
  promotion?: Maybe<Scalars["String"]["output"]>;
  side?: Maybe<Scalars["Int"]["output"]>;
  to?: Maybe<Scalars["String"]["output"]>;
  type?: Maybe<Scalars["String"]["output"]>;
  user_id?: Maybe<Scalars["uuid"]["output"]>;
};

/** order by max() on columns of table "badma.moves" */
export type Badma_Moves_Max_Order_By = {
  created_at?: InputMaybe<Order_By>;
  from?: InputMaybe<Order_By>;
  game_id?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  promotion?: InputMaybe<Order_By>;
  side?: InputMaybe<Order_By>;
  to?: InputMaybe<Order_By>;
  type?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Badma_Moves_Min_Fields = {
  __typename?: "badma_moves_min_fields";
  created_at?: Maybe<Scalars["timestamptz"]["output"]>;
  from?: Maybe<Scalars["String"]["output"]>;
  game_id?: Maybe<Scalars["uuid"]["output"]>;
  id?: Maybe<Scalars["uuid"]["output"]>;
  promotion?: Maybe<Scalars["String"]["output"]>;
  side?: Maybe<Scalars["Int"]["output"]>;
  to?: Maybe<Scalars["String"]["output"]>;
  type?: Maybe<Scalars["String"]["output"]>;
  user_id?: Maybe<Scalars["uuid"]["output"]>;
};

/** order by min() on columns of table "badma.moves" */
export type Badma_Moves_Min_Order_By = {
  created_at?: InputMaybe<Order_By>;
  from?: InputMaybe<Order_By>;
  game_id?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  promotion?: InputMaybe<Order_By>;
  side?: InputMaybe<Order_By>;
  to?: InputMaybe<Order_By>;
  type?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "badma.moves" */
export type Badma_Moves_Mutation_Response = {
  __typename?: "badma_moves_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"]["output"];
  /** data from the rows affected by the mutation */
  returning: Array<Badma_Moves>;
};

/** on_conflict condition type for table "badma.moves" */
export type Badma_Moves_On_Conflict = {
  constraint: Badma_Moves_Constraint;
  update_columns?: Array<Badma_Moves_Update_Column>;
  where?: InputMaybe<Badma_Moves_Bool_Exp>;
};

/** Ordering options when selecting data from "badma.moves". */
export type Badma_Moves_Order_By = {
  created_at?: InputMaybe<Order_By>;
  from?: InputMaybe<Order_By>;
  game?: InputMaybe<Badma_Games_Order_By>;
  game_id?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  promotion?: InputMaybe<Order_By>;
  side?: InputMaybe<Order_By>;
  to?: InputMaybe<Order_By>;
  type?: InputMaybe<Order_By>;
  user?: InputMaybe<Users_Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** primary key columns input for table: badma.moves */
export type Badma_Moves_Pk_Columns_Input = {
  id: Scalars["uuid"]["input"];
};

/** select columns of table "badma.moves" */
export enum Badma_Moves_Select_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  From = "from",
  /** column name */
  GameId = "game_id",
  /** column name */
  Id = "id",
  /** column name */
  Promotion = "promotion",
  /** column name */
  Side = "side",
  /** column name */
  To = "to",
  /** column name */
  Type = "type",
  /** column name */
  UserId = "user_id",
}

/** input type for updating data in table "badma.moves" */
export type Badma_Moves_Set_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  from?: InputMaybe<Scalars["String"]["input"]>;
  game_id?: InputMaybe<Scalars["uuid"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  promotion?: InputMaybe<Scalars["String"]["input"]>;
  side?: InputMaybe<Scalars["Int"]["input"]>;
  to?: InputMaybe<Scalars["String"]["input"]>;
  type?: InputMaybe<Scalars["String"]["input"]>;
  user_id?: InputMaybe<Scalars["uuid"]["input"]>;
};

/** aggregate stddev on columns */
export type Badma_Moves_Stddev_Fields = {
  __typename?: "badma_moves_stddev_fields";
  side?: Maybe<Scalars["Float"]["output"]>;
};

/** order by stddev() on columns of table "badma.moves" */
export type Badma_Moves_Stddev_Order_By = {
  side?: InputMaybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Badma_Moves_Stddev_Pop_Fields = {
  __typename?: "badma_moves_stddev_pop_fields";
  side?: Maybe<Scalars["Float"]["output"]>;
};

/** order by stddev_pop() on columns of table "badma.moves" */
export type Badma_Moves_Stddev_Pop_Order_By = {
  side?: InputMaybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Badma_Moves_Stddev_Samp_Fields = {
  __typename?: "badma_moves_stddev_samp_fields";
  side?: Maybe<Scalars["Float"]["output"]>;
};

/** order by stddev_samp() on columns of table "badma.moves" */
export type Badma_Moves_Stddev_Samp_Order_By = {
  side?: InputMaybe<Order_By>;
};

/** Streaming cursor of the table "badma_moves" */
export type Badma_Moves_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Badma_Moves_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Badma_Moves_Stream_Cursor_Value_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  from?: InputMaybe<Scalars["String"]["input"]>;
  game_id?: InputMaybe<Scalars["uuid"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  promotion?: InputMaybe<Scalars["String"]["input"]>;
  side?: InputMaybe<Scalars["Int"]["input"]>;
  to?: InputMaybe<Scalars["String"]["input"]>;
  type?: InputMaybe<Scalars["String"]["input"]>;
  user_id?: InputMaybe<Scalars["uuid"]["input"]>;
};

/** aggregate sum on columns */
export type Badma_Moves_Sum_Fields = {
  __typename?: "badma_moves_sum_fields";
  side?: Maybe<Scalars["Int"]["output"]>;
};

/** order by sum() on columns of table "badma.moves" */
export type Badma_Moves_Sum_Order_By = {
  side?: InputMaybe<Order_By>;
};

/** update columns of table "badma.moves" */
export enum Badma_Moves_Update_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  From = "from",
  /** column name */
  GameId = "game_id",
  /** column name */
  Id = "id",
  /** column name */
  Promotion = "promotion",
  /** column name */
  Side = "side",
  /** column name */
  To = "to",
  /** column name */
  Type = "type",
  /** column name */
  UserId = "user_id",
}

export type Badma_Moves_Updates = {
  /** increments the numeric columns with given value of the filtered values */
  _inc?: InputMaybe<Badma_Moves_Inc_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Badma_Moves_Set_Input>;
  /** filter the rows which have to be updated */
  where: Badma_Moves_Bool_Exp;
};

/** aggregate var_pop on columns */
export type Badma_Moves_Var_Pop_Fields = {
  __typename?: "badma_moves_var_pop_fields";
  side?: Maybe<Scalars["Float"]["output"]>;
};

/** order by var_pop() on columns of table "badma.moves" */
export type Badma_Moves_Var_Pop_Order_By = {
  side?: InputMaybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Badma_Moves_Var_Samp_Fields = {
  __typename?: "badma_moves_var_samp_fields";
  side?: Maybe<Scalars["Float"]["output"]>;
};

/** order by var_samp() on columns of table "badma.moves" */
export type Badma_Moves_Var_Samp_Order_By = {
  side?: InputMaybe<Order_By>;
};

/** aggregate variance on columns */
export type Badma_Moves_Variance_Fields = {
  __typename?: "badma_moves_variance_fields";
  side?: Maybe<Scalars["Float"]["output"]>;
};

/** order by variance() on columns of table "badma.moves" */
export type Badma_Moves_Variance_Order_By = {
  side?: InputMaybe<Order_By>;
};

/** columns and relationships of "badma.servers" */
export type Badma_Servers = {
  __typename?: "badma_servers";
  active_at: Scalars["timestamptz"]["output"];
  created_at: Scalars["timestamptz"]["output"];
  global_address: Scalars["String"]["output"];
  id: Scalars["uuid"]["output"];
  local_address: Scalars["String"]["output"];
};

/** aggregated selection of "badma.servers" */
export type Badma_Servers_Aggregate = {
  __typename?: "badma_servers_aggregate";
  aggregate?: Maybe<Badma_Servers_Aggregate_Fields>;
  nodes: Array<Badma_Servers>;
};

/** aggregate fields of "badma.servers" */
export type Badma_Servers_Aggregate_Fields = {
  __typename?: "badma_servers_aggregate_fields";
  count: Scalars["Int"]["output"];
  max?: Maybe<Badma_Servers_Max_Fields>;
  min?: Maybe<Badma_Servers_Min_Fields>;
};

/** aggregate fields of "badma.servers" */
export type Badma_Servers_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Badma_Servers_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]["input"]>;
};

/** Boolean expression to filter rows from the table "badma.servers". All fields are combined with a logical 'AND'. */
export type Badma_Servers_Bool_Exp = {
  _and?: InputMaybe<Array<Badma_Servers_Bool_Exp>>;
  _not?: InputMaybe<Badma_Servers_Bool_Exp>;
  _or?: InputMaybe<Array<Badma_Servers_Bool_Exp>>;
  active_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  global_address?: InputMaybe<String_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  local_address?: InputMaybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "badma.servers" */
export enum Badma_Servers_Constraint {
  /** unique or primary key constraint on columns "id" */
  ServersPkey = "servers_pkey",
}

/** input type for inserting data into table "badma.servers" */
export type Badma_Servers_Insert_Input = {
  active_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  global_address?: InputMaybe<Scalars["String"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  local_address?: InputMaybe<Scalars["String"]["input"]>;
};

/** aggregate max on columns */
export type Badma_Servers_Max_Fields = {
  __typename?: "badma_servers_max_fields";
  active_at?: Maybe<Scalars["timestamptz"]["output"]>;
  created_at?: Maybe<Scalars["timestamptz"]["output"]>;
  global_address?: Maybe<Scalars["String"]["output"]>;
  id?: Maybe<Scalars["uuid"]["output"]>;
  local_address?: Maybe<Scalars["String"]["output"]>;
};

/** aggregate min on columns */
export type Badma_Servers_Min_Fields = {
  __typename?: "badma_servers_min_fields";
  active_at?: Maybe<Scalars["timestamptz"]["output"]>;
  created_at?: Maybe<Scalars["timestamptz"]["output"]>;
  global_address?: Maybe<Scalars["String"]["output"]>;
  id?: Maybe<Scalars["uuid"]["output"]>;
  local_address?: Maybe<Scalars["String"]["output"]>;
};

/** response of any mutation on the table "badma.servers" */
export type Badma_Servers_Mutation_Response = {
  __typename?: "badma_servers_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"]["output"];
  /** data from the rows affected by the mutation */
  returning: Array<Badma_Servers>;
};

/** on_conflict condition type for table "badma.servers" */
export type Badma_Servers_On_Conflict = {
  constraint: Badma_Servers_Constraint;
  update_columns?: Array<Badma_Servers_Update_Column>;
  where?: InputMaybe<Badma_Servers_Bool_Exp>;
};

/** Ordering options when selecting data from "badma.servers". */
export type Badma_Servers_Order_By = {
  active_at?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  global_address?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  local_address?: InputMaybe<Order_By>;
};

/** primary key columns input for table: badma.servers */
export type Badma_Servers_Pk_Columns_Input = {
  id: Scalars["uuid"]["input"];
};

/** select columns of table "badma.servers" */
export enum Badma_Servers_Select_Column {
  /** column name */
  ActiveAt = "active_at",
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  GlobalAddress = "global_address",
  /** column name */
  Id = "id",
  /** column name */
  LocalAddress = "local_address",
}

/** input type for updating data in table "badma.servers" */
export type Badma_Servers_Set_Input = {
  active_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  global_address?: InputMaybe<Scalars["String"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  local_address?: InputMaybe<Scalars["String"]["input"]>;
};

/** Streaming cursor of the table "badma_servers" */
export type Badma_Servers_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Badma_Servers_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Badma_Servers_Stream_Cursor_Value_Input = {
  active_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  global_address?: InputMaybe<Scalars["String"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  local_address?: InputMaybe<Scalars["String"]["input"]>;
};

/** update columns of table "badma.servers" */
export enum Badma_Servers_Update_Column {
  /** column name */
  ActiveAt = "active_at",
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  GlobalAddress = "global_address",
  /** column name */
  Id = "id",
  /** column name */
  LocalAddress = "local_address",
}

export type Badma_Servers_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Badma_Servers_Set_Input>;
  /** filter the rows which have to be updated */
  where: Badma_Servers_Bool_Exp;
};

/** columns and relationships of "badma.tournament_games" */
export type Badma_Tournament_Games = {
  __typename?: "badma_tournament_games";
  created_at: Scalars["timestamptz"]["output"];
  /** An object relationship */
  game: Badma_Games;
  game_id: Scalars["uuid"]["output"];
  id: Scalars["uuid"]["output"];
  /** An object relationship */
  tournament: Badma_Tournaments;
  tournament_id: Scalars["uuid"]["output"];
  updated_at: Scalars["timestamptz"]["output"];
};

/** aggregated selection of "badma.tournament_games" */
export type Badma_Tournament_Games_Aggregate = {
  __typename?: "badma_tournament_games_aggregate";
  aggregate?: Maybe<Badma_Tournament_Games_Aggregate_Fields>;
  nodes: Array<Badma_Tournament_Games>;
};

export type Badma_Tournament_Games_Aggregate_Bool_Exp = {
  count?: InputMaybe<Badma_Tournament_Games_Aggregate_Bool_Exp_Count>;
};

export type Badma_Tournament_Games_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Badma_Tournament_Games_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]["input"]>;
  filter?: InputMaybe<Badma_Tournament_Games_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "badma.tournament_games" */
export type Badma_Tournament_Games_Aggregate_Fields = {
  __typename?: "badma_tournament_games_aggregate_fields";
  count: Scalars["Int"]["output"];
  max?: Maybe<Badma_Tournament_Games_Max_Fields>;
  min?: Maybe<Badma_Tournament_Games_Min_Fields>;
};

/** aggregate fields of "badma.tournament_games" */
export type Badma_Tournament_Games_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Badma_Tournament_Games_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]["input"]>;
};

/** order by aggregate values of table "badma.tournament_games" */
export type Badma_Tournament_Games_Aggregate_Order_By = {
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Badma_Tournament_Games_Max_Order_By>;
  min?: InputMaybe<Badma_Tournament_Games_Min_Order_By>;
};

/** input type for inserting array relation for remote table "badma.tournament_games" */
export type Badma_Tournament_Games_Arr_Rel_Insert_Input = {
  data: Array<Badma_Tournament_Games_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<Badma_Tournament_Games_On_Conflict>;
};

/** Boolean expression to filter rows from the table "badma.tournament_games". All fields are combined with a logical 'AND'. */
export type Badma_Tournament_Games_Bool_Exp = {
  _and?: InputMaybe<Array<Badma_Tournament_Games_Bool_Exp>>;
  _not?: InputMaybe<Badma_Tournament_Games_Bool_Exp>;
  _or?: InputMaybe<Array<Badma_Tournament_Games_Bool_Exp>>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  game?: InputMaybe<Badma_Games_Bool_Exp>;
  game_id?: InputMaybe<Uuid_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  tournament?: InputMaybe<Badma_Tournaments_Bool_Exp>;
  tournament_id?: InputMaybe<Uuid_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "badma.tournament_games" */
export enum Badma_Tournament_Games_Constraint {
  /** unique or primary key constraint on columns "tournament_id", "game_id" */
  TournamentGamesGameIdTournamentIdKey = "tournament_games_game_id_tournament_id_key",
  /** unique or primary key constraint on columns "id" */
  TournamentGamesPkey = "tournament_games_pkey",
}

/** input type for inserting data into table "badma.tournament_games" */
export type Badma_Tournament_Games_Insert_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  game?: InputMaybe<Badma_Games_Obj_Rel_Insert_Input>;
  game_id?: InputMaybe<Scalars["uuid"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  tournament?: InputMaybe<Badma_Tournaments_Obj_Rel_Insert_Input>;
  tournament_id?: InputMaybe<Scalars["uuid"]["input"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
};

/** aggregate max on columns */
export type Badma_Tournament_Games_Max_Fields = {
  __typename?: "badma_tournament_games_max_fields";
  created_at?: Maybe<Scalars["timestamptz"]["output"]>;
  game_id?: Maybe<Scalars["uuid"]["output"]>;
  id?: Maybe<Scalars["uuid"]["output"]>;
  tournament_id?: Maybe<Scalars["uuid"]["output"]>;
  updated_at?: Maybe<Scalars["timestamptz"]["output"]>;
};

/** order by max() on columns of table "badma.tournament_games" */
export type Badma_Tournament_Games_Max_Order_By = {
  created_at?: InputMaybe<Order_By>;
  game_id?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  tournament_id?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Badma_Tournament_Games_Min_Fields = {
  __typename?: "badma_tournament_games_min_fields";
  created_at?: Maybe<Scalars["timestamptz"]["output"]>;
  game_id?: Maybe<Scalars["uuid"]["output"]>;
  id?: Maybe<Scalars["uuid"]["output"]>;
  tournament_id?: Maybe<Scalars["uuid"]["output"]>;
  updated_at?: Maybe<Scalars["timestamptz"]["output"]>;
};

/** order by min() on columns of table "badma.tournament_games" */
export type Badma_Tournament_Games_Min_Order_By = {
  created_at?: InputMaybe<Order_By>;
  game_id?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  tournament_id?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "badma.tournament_games" */
export type Badma_Tournament_Games_Mutation_Response = {
  __typename?: "badma_tournament_games_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"]["output"];
  /** data from the rows affected by the mutation */
  returning: Array<Badma_Tournament_Games>;
};

/** on_conflict condition type for table "badma.tournament_games" */
export type Badma_Tournament_Games_On_Conflict = {
  constraint: Badma_Tournament_Games_Constraint;
  update_columns?: Array<Badma_Tournament_Games_Update_Column>;
  where?: InputMaybe<Badma_Tournament_Games_Bool_Exp>;
};

/** Ordering options when selecting data from "badma.tournament_games". */
export type Badma_Tournament_Games_Order_By = {
  created_at?: InputMaybe<Order_By>;
  game?: InputMaybe<Badma_Games_Order_By>;
  game_id?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  tournament?: InputMaybe<Badma_Tournaments_Order_By>;
  tournament_id?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** primary key columns input for table: badma.tournament_games */
export type Badma_Tournament_Games_Pk_Columns_Input = {
  id: Scalars["uuid"]["input"];
};

/** select columns of table "badma.tournament_games" */
export enum Badma_Tournament_Games_Select_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  GameId = "game_id",
  /** column name */
  Id = "id",
  /** column name */
  TournamentId = "tournament_id",
  /** column name */
  UpdatedAt = "updated_at",
}

/** input type for updating data in table "badma.tournament_games" */
export type Badma_Tournament_Games_Set_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  game_id?: InputMaybe<Scalars["uuid"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  tournament_id?: InputMaybe<Scalars["uuid"]["input"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
};

/** Streaming cursor of the table "badma_tournament_games" */
export type Badma_Tournament_Games_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Badma_Tournament_Games_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Badma_Tournament_Games_Stream_Cursor_Value_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  game_id?: InputMaybe<Scalars["uuid"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  tournament_id?: InputMaybe<Scalars["uuid"]["input"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
};

/** update columns of table "badma.tournament_games" */
export enum Badma_Tournament_Games_Update_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  GameId = "game_id",
  /** column name */
  Id = "id",
  /** column name */
  TournamentId = "tournament_id",
  /** column name */
  UpdatedAt = "updated_at",
}

export type Badma_Tournament_Games_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Badma_Tournament_Games_Set_Input>;
  /** filter the rows which have to be updated */
  where: Badma_Tournament_Games_Bool_Exp;
};

/** columns and relationships of "badma.tournament_participants" */
export type Badma_Tournament_Participants = {
  __typename?: "badma_tournament_participants";
  created_at: Scalars["timestamptz"]["output"];
  id: Scalars["uuid"]["output"];
  /** 1 for join, 0 for leave */
  role: Scalars["Int"]["output"];
  /** An array relationship */
  scores: Array<Badma_Tournament_Scores>;
  /** An aggregate relationship */
  scores_aggregate: Badma_Tournament_Scores_Aggregate;
  /** An object relationship */
  tournament: Badma_Tournaments;
  tournament_id: Scalars["uuid"]["output"];
  updated_at: Scalars["timestamptz"]["output"];
  /** An object relationship */
  user: Users;
  user_id: Scalars["uuid"]["output"];
};

/** columns and relationships of "badma.tournament_participants" */
export type Badma_Tournament_ParticipantsScoresArgs = {
  distinct_on?: InputMaybe<Array<Badma_Tournament_Scores_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Tournament_Scores_Order_By>>;
  where?: InputMaybe<Badma_Tournament_Scores_Bool_Exp>;
};

/** columns and relationships of "badma.tournament_participants" */
export type Badma_Tournament_ParticipantsScores_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Badma_Tournament_Scores_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Tournament_Scores_Order_By>>;
  where?: InputMaybe<Badma_Tournament_Scores_Bool_Exp>;
};

/** aggregated selection of "badma.tournament_participants" */
export type Badma_Tournament_Participants_Aggregate = {
  __typename?: "badma_tournament_participants_aggregate";
  aggregate?: Maybe<Badma_Tournament_Participants_Aggregate_Fields>;
  nodes: Array<Badma_Tournament_Participants>;
};

export type Badma_Tournament_Participants_Aggregate_Bool_Exp = {
  count?: InputMaybe<Badma_Tournament_Participants_Aggregate_Bool_Exp_Count>;
};

export type Badma_Tournament_Participants_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Badma_Tournament_Participants_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]["input"]>;
  filter?: InputMaybe<Badma_Tournament_Participants_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "badma.tournament_participants" */
export type Badma_Tournament_Participants_Aggregate_Fields = {
  __typename?: "badma_tournament_participants_aggregate_fields";
  avg?: Maybe<Badma_Tournament_Participants_Avg_Fields>;
  count: Scalars["Int"]["output"];
  max?: Maybe<Badma_Tournament_Participants_Max_Fields>;
  min?: Maybe<Badma_Tournament_Participants_Min_Fields>;
  stddev?: Maybe<Badma_Tournament_Participants_Stddev_Fields>;
  stddev_pop?: Maybe<Badma_Tournament_Participants_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Badma_Tournament_Participants_Stddev_Samp_Fields>;
  sum?: Maybe<Badma_Tournament_Participants_Sum_Fields>;
  var_pop?: Maybe<Badma_Tournament_Participants_Var_Pop_Fields>;
  var_samp?: Maybe<Badma_Tournament_Participants_Var_Samp_Fields>;
  variance?: Maybe<Badma_Tournament_Participants_Variance_Fields>;
};

/** aggregate fields of "badma.tournament_participants" */
export type Badma_Tournament_Participants_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Badma_Tournament_Participants_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]["input"]>;
};

/** order by aggregate values of table "badma.tournament_participants" */
export type Badma_Tournament_Participants_Aggregate_Order_By = {
  avg?: InputMaybe<Badma_Tournament_Participants_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Badma_Tournament_Participants_Max_Order_By>;
  min?: InputMaybe<Badma_Tournament_Participants_Min_Order_By>;
  stddev?: InputMaybe<Badma_Tournament_Participants_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Badma_Tournament_Participants_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Badma_Tournament_Participants_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Badma_Tournament_Participants_Sum_Order_By>;
  var_pop?: InputMaybe<Badma_Tournament_Participants_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Badma_Tournament_Participants_Var_Samp_Order_By>;
  variance?: InputMaybe<Badma_Tournament_Participants_Variance_Order_By>;
};

/** input type for inserting array relation for remote table "badma.tournament_participants" */
export type Badma_Tournament_Participants_Arr_Rel_Insert_Input = {
  data: Array<Badma_Tournament_Participants_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<Badma_Tournament_Participants_On_Conflict>;
};

/** aggregate avg on columns */
export type Badma_Tournament_Participants_Avg_Fields = {
  __typename?: "badma_tournament_participants_avg_fields";
  /** 1 for join, 0 for leave */
  role?: Maybe<Scalars["Float"]["output"]>;
};

/** order by avg() on columns of table "badma.tournament_participants" */
export type Badma_Tournament_Participants_Avg_Order_By = {
  /** 1 for join, 0 for leave */
  role?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "badma.tournament_participants". All fields are combined with a logical 'AND'. */
export type Badma_Tournament_Participants_Bool_Exp = {
  _and?: InputMaybe<Array<Badma_Tournament_Participants_Bool_Exp>>;
  _not?: InputMaybe<Badma_Tournament_Participants_Bool_Exp>;
  _or?: InputMaybe<Array<Badma_Tournament_Participants_Bool_Exp>>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  role?: InputMaybe<Int_Comparison_Exp>;
  scores?: InputMaybe<Badma_Tournament_Scores_Bool_Exp>;
  scores_aggregate?: InputMaybe<Badma_Tournament_Scores_Aggregate_Bool_Exp>;
  tournament?: InputMaybe<Badma_Tournaments_Bool_Exp>;
  tournament_id?: InputMaybe<Uuid_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  user?: InputMaybe<Users_Bool_Exp>;
  user_id?: InputMaybe<Uuid_Comparison_Exp>;
};

/** unique or primary key constraints on table "badma.tournament_participants" */
export enum Badma_Tournament_Participants_Constraint {
  /** unique or primary key constraint on columns "id" */
  TournamentParticipantsPkey = "tournament_participants_pkey",
}

/** input type for incrementing numeric columns in table "badma.tournament_participants" */
export type Badma_Tournament_Participants_Inc_Input = {
  /** 1 for join, 0 for leave */
  role?: InputMaybe<Scalars["Int"]["input"]>;
};

/** input type for inserting data into table "badma.tournament_participants" */
export type Badma_Tournament_Participants_Insert_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  /** 1 for join, 0 for leave */
  role?: InputMaybe<Scalars["Int"]["input"]>;
  scores?: InputMaybe<Badma_Tournament_Scores_Arr_Rel_Insert_Input>;
  tournament?: InputMaybe<Badma_Tournaments_Obj_Rel_Insert_Input>;
  tournament_id?: InputMaybe<Scalars["uuid"]["input"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  user?: InputMaybe<Users_Obj_Rel_Insert_Input>;
  user_id?: InputMaybe<Scalars["uuid"]["input"]>;
};

/** aggregate max on columns */
export type Badma_Tournament_Participants_Max_Fields = {
  __typename?: "badma_tournament_participants_max_fields";
  created_at?: Maybe<Scalars["timestamptz"]["output"]>;
  id?: Maybe<Scalars["uuid"]["output"]>;
  /** 1 for join, 0 for leave */
  role?: Maybe<Scalars["Int"]["output"]>;
  tournament_id?: Maybe<Scalars["uuid"]["output"]>;
  updated_at?: Maybe<Scalars["timestamptz"]["output"]>;
  user_id?: Maybe<Scalars["uuid"]["output"]>;
};

/** order by max() on columns of table "badma.tournament_participants" */
export type Badma_Tournament_Participants_Max_Order_By = {
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  /** 1 for join, 0 for leave */
  role?: InputMaybe<Order_By>;
  tournament_id?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Badma_Tournament_Participants_Min_Fields = {
  __typename?: "badma_tournament_participants_min_fields";
  created_at?: Maybe<Scalars["timestamptz"]["output"]>;
  id?: Maybe<Scalars["uuid"]["output"]>;
  /** 1 for join, 0 for leave */
  role?: Maybe<Scalars["Int"]["output"]>;
  tournament_id?: Maybe<Scalars["uuid"]["output"]>;
  updated_at?: Maybe<Scalars["timestamptz"]["output"]>;
  user_id?: Maybe<Scalars["uuid"]["output"]>;
};

/** order by min() on columns of table "badma.tournament_participants" */
export type Badma_Tournament_Participants_Min_Order_By = {
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  /** 1 for join, 0 for leave */
  role?: InputMaybe<Order_By>;
  tournament_id?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "badma.tournament_participants" */
export type Badma_Tournament_Participants_Mutation_Response = {
  __typename?: "badma_tournament_participants_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"]["output"];
  /** data from the rows affected by the mutation */
  returning: Array<Badma_Tournament_Participants>;
};

/** input type for inserting object relation for remote table "badma.tournament_participants" */
export type Badma_Tournament_Participants_Obj_Rel_Insert_Input = {
  data: Badma_Tournament_Participants_Insert_Input;
  /** upsert condition */
  on_conflict?: InputMaybe<Badma_Tournament_Participants_On_Conflict>;
};

/** on_conflict condition type for table "badma.tournament_participants" */
export type Badma_Tournament_Participants_On_Conflict = {
  constraint: Badma_Tournament_Participants_Constraint;
  update_columns?: Array<Badma_Tournament_Participants_Update_Column>;
  where?: InputMaybe<Badma_Tournament_Participants_Bool_Exp>;
};

/** Ordering options when selecting data from "badma.tournament_participants". */
export type Badma_Tournament_Participants_Order_By = {
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  role?: InputMaybe<Order_By>;
  scores_aggregate?: InputMaybe<Badma_Tournament_Scores_Aggregate_Order_By>;
  tournament?: InputMaybe<Badma_Tournaments_Order_By>;
  tournament_id?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  user?: InputMaybe<Users_Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** primary key columns input for table: badma.tournament_participants */
export type Badma_Tournament_Participants_Pk_Columns_Input = {
  id: Scalars["uuid"]["input"];
};

/** select columns of table "badma.tournament_participants" */
export enum Badma_Tournament_Participants_Select_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Id = "id",
  /** column name */
  Role = "role",
  /** column name */
  TournamentId = "tournament_id",
  /** column name */
  UpdatedAt = "updated_at",
  /** column name */
  UserId = "user_id",
}

/** input type for updating data in table "badma.tournament_participants" */
export type Badma_Tournament_Participants_Set_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  /** 1 for join, 0 for leave */
  role?: InputMaybe<Scalars["Int"]["input"]>;
  tournament_id?: InputMaybe<Scalars["uuid"]["input"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  user_id?: InputMaybe<Scalars["uuid"]["input"]>;
};

/** aggregate stddev on columns */
export type Badma_Tournament_Participants_Stddev_Fields = {
  __typename?: "badma_tournament_participants_stddev_fields";
  /** 1 for join, 0 for leave */
  role?: Maybe<Scalars["Float"]["output"]>;
};

/** order by stddev() on columns of table "badma.tournament_participants" */
export type Badma_Tournament_Participants_Stddev_Order_By = {
  /** 1 for join, 0 for leave */
  role?: InputMaybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Badma_Tournament_Participants_Stddev_Pop_Fields = {
  __typename?: "badma_tournament_participants_stddev_pop_fields";
  /** 1 for join, 0 for leave */
  role?: Maybe<Scalars["Float"]["output"]>;
};

/** order by stddev_pop() on columns of table "badma.tournament_participants" */
export type Badma_Tournament_Participants_Stddev_Pop_Order_By = {
  /** 1 for join, 0 for leave */
  role?: InputMaybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Badma_Tournament_Participants_Stddev_Samp_Fields = {
  __typename?: "badma_tournament_participants_stddev_samp_fields";
  /** 1 for join, 0 for leave */
  role?: Maybe<Scalars["Float"]["output"]>;
};

/** order by stddev_samp() on columns of table "badma.tournament_participants" */
export type Badma_Tournament_Participants_Stddev_Samp_Order_By = {
  /** 1 for join, 0 for leave */
  role?: InputMaybe<Order_By>;
};

/** Streaming cursor of the table "badma_tournament_participants" */
export type Badma_Tournament_Participants_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Badma_Tournament_Participants_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Badma_Tournament_Participants_Stream_Cursor_Value_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  /** 1 for join, 0 for leave */
  role?: InputMaybe<Scalars["Int"]["input"]>;
  tournament_id?: InputMaybe<Scalars["uuid"]["input"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  user_id?: InputMaybe<Scalars["uuid"]["input"]>;
};

/** aggregate sum on columns */
export type Badma_Tournament_Participants_Sum_Fields = {
  __typename?: "badma_tournament_participants_sum_fields";
  /** 1 for join, 0 for leave */
  role?: Maybe<Scalars["Int"]["output"]>;
};

/** order by sum() on columns of table "badma.tournament_participants" */
export type Badma_Tournament_Participants_Sum_Order_By = {
  /** 1 for join, 0 for leave */
  role?: InputMaybe<Order_By>;
};

/** update columns of table "badma.tournament_participants" */
export enum Badma_Tournament_Participants_Update_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Id = "id",
  /** column name */
  Role = "role",
  /** column name */
  TournamentId = "tournament_id",
  /** column name */
  UpdatedAt = "updated_at",
  /** column name */
  UserId = "user_id",
}

export type Badma_Tournament_Participants_Updates = {
  /** increments the numeric columns with given value of the filtered values */
  _inc?: InputMaybe<Badma_Tournament_Participants_Inc_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Badma_Tournament_Participants_Set_Input>;
  /** filter the rows which have to be updated */
  where: Badma_Tournament_Participants_Bool_Exp;
};

/** aggregate var_pop on columns */
export type Badma_Tournament_Participants_Var_Pop_Fields = {
  __typename?: "badma_tournament_participants_var_pop_fields";
  /** 1 for join, 0 for leave */
  role?: Maybe<Scalars["Float"]["output"]>;
};

/** order by var_pop() on columns of table "badma.tournament_participants" */
export type Badma_Tournament_Participants_Var_Pop_Order_By = {
  /** 1 for join, 0 for leave */
  role?: InputMaybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Badma_Tournament_Participants_Var_Samp_Fields = {
  __typename?: "badma_tournament_participants_var_samp_fields";
  /** 1 for join, 0 for leave */
  role?: Maybe<Scalars["Float"]["output"]>;
};

/** order by var_samp() on columns of table "badma.tournament_participants" */
export type Badma_Tournament_Participants_Var_Samp_Order_By = {
  /** 1 for join, 0 for leave */
  role?: InputMaybe<Order_By>;
};

/** aggregate variance on columns */
export type Badma_Tournament_Participants_Variance_Fields = {
  __typename?: "badma_tournament_participants_variance_fields";
  /** 1 for join, 0 for leave */
  role?: Maybe<Scalars["Float"]["output"]>;
};

/** order by variance() on columns of table "badma.tournament_participants" */
export type Badma_Tournament_Participants_Variance_Order_By = {
  /** 1 for join, 0 for leave */
  role?: InputMaybe<Order_By>;
};

/** columns and relationships of "badma.tournament_scores" */
export type Badma_Tournament_Scores = {
  __typename?: "badma_tournament_scores";
  created_at: Scalars["timestamptz"]["output"];
  /** An object relationship */
  game: Badma_Games;
  game_id: Scalars["uuid"]["output"];
  id: Scalars["uuid"]["output"];
  score: Scalars["numeric"]["output"];
  tournament_participant_id: Scalars["uuid"]["output"];
  /** An object relationship */
  tournament_participation: Badma_Tournament_Participants;
  updated_at: Scalars["timestamptz"]["output"];
};

/** aggregated selection of "badma.tournament_scores" */
export type Badma_Tournament_Scores_Aggregate = {
  __typename?: "badma_tournament_scores_aggregate";
  aggregate?: Maybe<Badma_Tournament_Scores_Aggregate_Fields>;
  nodes: Array<Badma_Tournament_Scores>;
};

export type Badma_Tournament_Scores_Aggregate_Bool_Exp = {
  count?: InputMaybe<Badma_Tournament_Scores_Aggregate_Bool_Exp_Count>;
};

export type Badma_Tournament_Scores_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Badma_Tournament_Scores_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]["input"]>;
  filter?: InputMaybe<Badma_Tournament_Scores_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "badma.tournament_scores" */
export type Badma_Tournament_Scores_Aggregate_Fields = {
  __typename?: "badma_tournament_scores_aggregate_fields";
  avg?: Maybe<Badma_Tournament_Scores_Avg_Fields>;
  count: Scalars["Int"]["output"];
  max?: Maybe<Badma_Tournament_Scores_Max_Fields>;
  min?: Maybe<Badma_Tournament_Scores_Min_Fields>;
  stddev?: Maybe<Badma_Tournament_Scores_Stddev_Fields>;
  stddev_pop?: Maybe<Badma_Tournament_Scores_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Badma_Tournament_Scores_Stddev_Samp_Fields>;
  sum?: Maybe<Badma_Tournament_Scores_Sum_Fields>;
  var_pop?: Maybe<Badma_Tournament_Scores_Var_Pop_Fields>;
  var_samp?: Maybe<Badma_Tournament_Scores_Var_Samp_Fields>;
  variance?: Maybe<Badma_Tournament_Scores_Variance_Fields>;
};

/** aggregate fields of "badma.tournament_scores" */
export type Badma_Tournament_Scores_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Badma_Tournament_Scores_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]["input"]>;
};

/** order by aggregate values of table "badma.tournament_scores" */
export type Badma_Tournament_Scores_Aggregate_Order_By = {
  avg?: InputMaybe<Badma_Tournament_Scores_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Badma_Tournament_Scores_Max_Order_By>;
  min?: InputMaybe<Badma_Tournament_Scores_Min_Order_By>;
  stddev?: InputMaybe<Badma_Tournament_Scores_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Badma_Tournament_Scores_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Badma_Tournament_Scores_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Badma_Tournament_Scores_Sum_Order_By>;
  var_pop?: InputMaybe<Badma_Tournament_Scores_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Badma_Tournament_Scores_Var_Samp_Order_By>;
  variance?: InputMaybe<Badma_Tournament_Scores_Variance_Order_By>;
};

/** input type for inserting array relation for remote table "badma.tournament_scores" */
export type Badma_Tournament_Scores_Arr_Rel_Insert_Input = {
  data: Array<Badma_Tournament_Scores_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<Badma_Tournament_Scores_On_Conflict>;
};

/** aggregate avg on columns */
export type Badma_Tournament_Scores_Avg_Fields = {
  __typename?: "badma_tournament_scores_avg_fields";
  score?: Maybe<Scalars["Float"]["output"]>;
};

/** order by avg() on columns of table "badma.tournament_scores" */
export type Badma_Tournament_Scores_Avg_Order_By = {
  score?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "badma.tournament_scores". All fields are combined with a logical 'AND'. */
export type Badma_Tournament_Scores_Bool_Exp = {
  _and?: InputMaybe<Array<Badma_Tournament_Scores_Bool_Exp>>;
  _not?: InputMaybe<Badma_Tournament_Scores_Bool_Exp>;
  _or?: InputMaybe<Array<Badma_Tournament_Scores_Bool_Exp>>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  game?: InputMaybe<Badma_Games_Bool_Exp>;
  game_id?: InputMaybe<Uuid_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  score?: InputMaybe<Numeric_Comparison_Exp>;
  tournament_participant_id?: InputMaybe<Uuid_Comparison_Exp>;
  tournament_participation?: InputMaybe<Badma_Tournament_Participants_Bool_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "badma.tournament_scores" */
export enum Badma_Tournament_Scores_Constraint {
  /** unique or primary key constraint on columns "id" */
  TournamentScoresPkey = "tournament_scores_pkey",
}

/** input type for incrementing numeric columns in table "badma.tournament_scores" */
export type Badma_Tournament_Scores_Inc_Input = {
  score?: InputMaybe<Scalars["numeric"]["input"]>;
};

/** input type for inserting data into table "badma.tournament_scores" */
export type Badma_Tournament_Scores_Insert_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  game?: InputMaybe<Badma_Games_Obj_Rel_Insert_Input>;
  game_id?: InputMaybe<Scalars["uuid"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  score?: InputMaybe<Scalars["numeric"]["input"]>;
  tournament_participant_id?: InputMaybe<Scalars["uuid"]["input"]>;
  tournament_participation?: InputMaybe<Badma_Tournament_Participants_Obj_Rel_Insert_Input>;
  updated_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
};

/** aggregate max on columns */
export type Badma_Tournament_Scores_Max_Fields = {
  __typename?: "badma_tournament_scores_max_fields";
  created_at?: Maybe<Scalars["timestamptz"]["output"]>;
  game_id?: Maybe<Scalars["uuid"]["output"]>;
  id?: Maybe<Scalars["uuid"]["output"]>;
  score?: Maybe<Scalars["numeric"]["output"]>;
  tournament_participant_id?: Maybe<Scalars["uuid"]["output"]>;
  updated_at?: Maybe<Scalars["timestamptz"]["output"]>;
};

/** order by max() on columns of table "badma.tournament_scores" */
export type Badma_Tournament_Scores_Max_Order_By = {
  created_at?: InputMaybe<Order_By>;
  game_id?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  score?: InputMaybe<Order_By>;
  tournament_participant_id?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Badma_Tournament_Scores_Min_Fields = {
  __typename?: "badma_tournament_scores_min_fields";
  created_at?: Maybe<Scalars["timestamptz"]["output"]>;
  game_id?: Maybe<Scalars["uuid"]["output"]>;
  id?: Maybe<Scalars["uuid"]["output"]>;
  score?: Maybe<Scalars["numeric"]["output"]>;
  tournament_participant_id?: Maybe<Scalars["uuid"]["output"]>;
  updated_at?: Maybe<Scalars["timestamptz"]["output"]>;
};

/** order by min() on columns of table "badma.tournament_scores" */
export type Badma_Tournament_Scores_Min_Order_By = {
  created_at?: InputMaybe<Order_By>;
  game_id?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  score?: InputMaybe<Order_By>;
  tournament_participant_id?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "badma.tournament_scores" */
export type Badma_Tournament_Scores_Mutation_Response = {
  __typename?: "badma_tournament_scores_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"]["output"];
  /** data from the rows affected by the mutation */
  returning: Array<Badma_Tournament_Scores>;
};

/** on_conflict condition type for table "badma.tournament_scores" */
export type Badma_Tournament_Scores_On_Conflict = {
  constraint: Badma_Tournament_Scores_Constraint;
  update_columns?: Array<Badma_Tournament_Scores_Update_Column>;
  where?: InputMaybe<Badma_Tournament_Scores_Bool_Exp>;
};

/** Ordering options when selecting data from "badma.tournament_scores". */
export type Badma_Tournament_Scores_Order_By = {
  created_at?: InputMaybe<Order_By>;
  game?: InputMaybe<Badma_Games_Order_By>;
  game_id?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  score?: InputMaybe<Order_By>;
  tournament_participant_id?: InputMaybe<Order_By>;
  tournament_participation?: InputMaybe<Badma_Tournament_Participants_Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** primary key columns input for table: badma.tournament_scores */
export type Badma_Tournament_Scores_Pk_Columns_Input = {
  id: Scalars["uuid"]["input"];
};

/** select columns of table "badma.tournament_scores" */
export enum Badma_Tournament_Scores_Select_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  GameId = "game_id",
  /** column name */
  Id = "id",
  /** column name */
  Score = "score",
  /** column name */
  TournamentParticipantId = "tournament_participant_id",
  /** column name */
  UpdatedAt = "updated_at",
}

/** input type for updating data in table "badma.tournament_scores" */
export type Badma_Tournament_Scores_Set_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  game_id?: InputMaybe<Scalars["uuid"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  score?: InputMaybe<Scalars["numeric"]["input"]>;
  tournament_participant_id?: InputMaybe<Scalars["uuid"]["input"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
};

/** aggregate stddev on columns */
export type Badma_Tournament_Scores_Stddev_Fields = {
  __typename?: "badma_tournament_scores_stddev_fields";
  score?: Maybe<Scalars["Float"]["output"]>;
};

/** order by stddev() on columns of table "badma.tournament_scores" */
export type Badma_Tournament_Scores_Stddev_Order_By = {
  score?: InputMaybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Badma_Tournament_Scores_Stddev_Pop_Fields = {
  __typename?: "badma_tournament_scores_stddev_pop_fields";
  score?: Maybe<Scalars["Float"]["output"]>;
};

/** order by stddev_pop() on columns of table "badma.tournament_scores" */
export type Badma_Tournament_Scores_Stddev_Pop_Order_By = {
  score?: InputMaybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Badma_Tournament_Scores_Stddev_Samp_Fields = {
  __typename?: "badma_tournament_scores_stddev_samp_fields";
  score?: Maybe<Scalars["Float"]["output"]>;
};

/** order by stddev_samp() on columns of table "badma.tournament_scores" */
export type Badma_Tournament_Scores_Stddev_Samp_Order_By = {
  score?: InputMaybe<Order_By>;
};

/** Streaming cursor of the table "badma_tournament_scores" */
export type Badma_Tournament_Scores_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Badma_Tournament_Scores_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Badma_Tournament_Scores_Stream_Cursor_Value_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  game_id?: InputMaybe<Scalars["uuid"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  score?: InputMaybe<Scalars["numeric"]["input"]>;
  tournament_participant_id?: InputMaybe<Scalars["uuid"]["input"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
};

/** aggregate sum on columns */
export type Badma_Tournament_Scores_Sum_Fields = {
  __typename?: "badma_tournament_scores_sum_fields";
  score?: Maybe<Scalars["numeric"]["output"]>;
};

/** order by sum() on columns of table "badma.tournament_scores" */
export type Badma_Tournament_Scores_Sum_Order_By = {
  score?: InputMaybe<Order_By>;
};

/** update columns of table "badma.tournament_scores" */
export enum Badma_Tournament_Scores_Update_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  GameId = "game_id",
  /** column name */
  Id = "id",
  /** column name */
  Score = "score",
  /** column name */
  TournamentParticipantId = "tournament_participant_id",
  /** column name */
  UpdatedAt = "updated_at",
}

export type Badma_Tournament_Scores_Updates = {
  /** increments the numeric columns with given value of the filtered values */
  _inc?: InputMaybe<Badma_Tournament_Scores_Inc_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Badma_Tournament_Scores_Set_Input>;
  /** filter the rows which have to be updated */
  where: Badma_Tournament_Scores_Bool_Exp;
};

/** aggregate var_pop on columns */
export type Badma_Tournament_Scores_Var_Pop_Fields = {
  __typename?: "badma_tournament_scores_var_pop_fields";
  score?: Maybe<Scalars["Float"]["output"]>;
};

/** order by var_pop() on columns of table "badma.tournament_scores" */
export type Badma_Tournament_Scores_Var_Pop_Order_By = {
  score?: InputMaybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Badma_Tournament_Scores_Var_Samp_Fields = {
  __typename?: "badma_tournament_scores_var_samp_fields";
  score?: Maybe<Scalars["Float"]["output"]>;
};

/** order by var_samp() on columns of table "badma.tournament_scores" */
export type Badma_Tournament_Scores_Var_Samp_Order_By = {
  score?: InputMaybe<Order_By>;
};

/** aggregate variance on columns */
export type Badma_Tournament_Scores_Variance_Fields = {
  __typename?: "badma_tournament_scores_variance_fields";
  score?: Maybe<Scalars["Float"]["output"]>;
};

/** order by variance() on columns of table "badma.tournament_scores" */
export type Badma_Tournament_Scores_Variance_Order_By = {
  score?: InputMaybe<Order_By>;
};

/** columns and relationships of "badma.tournaments" */
export type Badma_Tournaments = {
  __typename?: "badma_tournaments";
  created_at: Scalars["timestamptz"]["output"];
  id: Scalars["uuid"]["output"];
  /** An array relationship */
  participants: Array<Badma_Tournament_Participants>;
  /** An aggregate relationship */
  participants_aggregate: Badma_Tournament_Participants_Aggregate;
  status: Scalars["String"]["output"];
  /** An array relationship */
  tournament_games: Array<Badma_Tournament_Games>;
  /** An aggregate relationship */
  tournament_games_aggregate: Badma_Tournament_Games_Aggregate;
  type: Scalars["String"]["output"];
  updated_at: Scalars["timestamptz"]["output"];
};

/** columns and relationships of "badma.tournaments" */
export type Badma_TournamentsParticipantsArgs = {
  distinct_on?: InputMaybe<Array<Badma_Tournament_Participants_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Tournament_Participants_Order_By>>;
  where?: InputMaybe<Badma_Tournament_Participants_Bool_Exp>;
};

/** columns and relationships of "badma.tournaments" */
export type Badma_TournamentsParticipants_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Badma_Tournament_Participants_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Tournament_Participants_Order_By>>;
  where?: InputMaybe<Badma_Tournament_Participants_Bool_Exp>;
};

/** columns and relationships of "badma.tournaments" */
export type Badma_TournamentsTournament_GamesArgs = {
  distinct_on?: InputMaybe<Array<Badma_Tournament_Games_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Tournament_Games_Order_By>>;
  where?: InputMaybe<Badma_Tournament_Games_Bool_Exp>;
};

/** columns and relationships of "badma.tournaments" */
export type Badma_TournamentsTournament_Games_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Badma_Tournament_Games_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Tournament_Games_Order_By>>;
  where?: InputMaybe<Badma_Tournament_Games_Bool_Exp>;
};

/** aggregated selection of "badma.tournaments" */
export type Badma_Tournaments_Aggregate = {
  __typename?: "badma_tournaments_aggregate";
  aggregate?: Maybe<Badma_Tournaments_Aggregate_Fields>;
  nodes: Array<Badma_Tournaments>;
};

/** aggregate fields of "badma.tournaments" */
export type Badma_Tournaments_Aggregate_Fields = {
  __typename?: "badma_tournaments_aggregate_fields";
  count: Scalars["Int"]["output"];
  max?: Maybe<Badma_Tournaments_Max_Fields>;
  min?: Maybe<Badma_Tournaments_Min_Fields>;
};

/** aggregate fields of "badma.tournaments" */
export type Badma_Tournaments_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Badma_Tournaments_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]["input"]>;
};

/** Boolean expression to filter rows from the table "badma.tournaments". All fields are combined with a logical 'AND'. */
export type Badma_Tournaments_Bool_Exp = {
  _and?: InputMaybe<Array<Badma_Tournaments_Bool_Exp>>;
  _not?: InputMaybe<Badma_Tournaments_Bool_Exp>;
  _or?: InputMaybe<Array<Badma_Tournaments_Bool_Exp>>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  participants?: InputMaybe<Badma_Tournament_Participants_Bool_Exp>;
  participants_aggregate?: InputMaybe<Badma_Tournament_Participants_Aggregate_Bool_Exp>;
  status?: InputMaybe<String_Comparison_Exp>;
  tournament_games?: InputMaybe<Badma_Tournament_Games_Bool_Exp>;
  tournament_games_aggregate?: InputMaybe<Badma_Tournament_Games_Aggregate_Bool_Exp>;
  type?: InputMaybe<String_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "badma.tournaments" */
export enum Badma_Tournaments_Constraint {
  /** unique or primary key constraint on columns "id" */
  TournamentsPkey = "tournaments_pkey",
}

/** input type for inserting data into table "badma.tournaments" */
export type Badma_Tournaments_Insert_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  participants?: InputMaybe<Badma_Tournament_Participants_Arr_Rel_Insert_Input>;
  status?: InputMaybe<Scalars["String"]["input"]>;
  tournament_games?: InputMaybe<Badma_Tournament_Games_Arr_Rel_Insert_Input>;
  type?: InputMaybe<Scalars["String"]["input"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
};

/** aggregate max on columns */
export type Badma_Tournaments_Max_Fields = {
  __typename?: "badma_tournaments_max_fields";
  created_at?: Maybe<Scalars["timestamptz"]["output"]>;
  id?: Maybe<Scalars["uuid"]["output"]>;
  status?: Maybe<Scalars["String"]["output"]>;
  type?: Maybe<Scalars["String"]["output"]>;
  updated_at?: Maybe<Scalars["timestamptz"]["output"]>;
};

/** aggregate min on columns */
export type Badma_Tournaments_Min_Fields = {
  __typename?: "badma_tournaments_min_fields";
  created_at?: Maybe<Scalars["timestamptz"]["output"]>;
  id?: Maybe<Scalars["uuid"]["output"]>;
  status?: Maybe<Scalars["String"]["output"]>;
  type?: Maybe<Scalars["String"]["output"]>;
  updated_at?: Maybe<Scalars["timestamptz"]["output"]>;
};

/** response of any mutation on the table "badma.tournaments" */
export type Badma_Tournaments_Mutation_Response = {
  __typename?: "badma_tournaments_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"]["output"];
  /** data from the rows affected by the mutation */
  returning: Array<Badma_Tournaments>;
};

/** input type for inserting object relation for remote table "badma.tournaments" */
export type Badma_Tournaments_Obj_Rel_Insert_Input = {
  data: Badma_Tournaments_Insert_Input;
  /** upsert condition */
  on_conflict?: InputMaybe<Badma_Tournaments_On_Conflict>;
};

/** on_conflict condition type for table "badma.tournaments" */
export type Badma_Tournaments_On_Conflict = {
  constraint: Badma_Tournaments_Constraint;
  update_columns?: Array<Badma_Tournaments_Update_Column>;
  where?: InputMaybe<Badma_Tournaments_Bool_Exp>;
};

/** Ordering options when selecting data from "badma.tournaments". */
export type Badma_Tournaments_Order_By = {
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  participants_aggregate?: InputMaybe<Badma_Tournament_Participants_Aggregate_Order_By>;
  status?: InputMaybe<Order_By>;
  tournament_games_aggregate?: InputMaybe<Badma_Tournament_Games_Aggregate_Order_By>;
  type?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** primary key columns input for table: badma.tournaments */
export type Badma_Tournaments_Pk_Columns_Input = {
  id: Scalars["uuid"]["input"];
};

/** select columns of table "badma.tournaments" */
export enum Badma_Tournaments_Select_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Id = "id",
  /** column name */
  Status = "status",
  /** column name */
  Type = "type",
  /** column name */
  UpdatedAt = "updated_at",
}

/** input type for updating data in table "badma.tournaments" */
export type Badma_Tournaments_Set_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  status?: InputMaybe<Scalars["String"]["input"]>;
  type?: InputMaybe<Scalars["String"]["input"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
};

/** Streaming cursor of the table "badma_tournaments" */
export type Badma_Tournaments_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Badma_Tournaments_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Badma_Tournaments_Stream_Cursor_Value_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  status?: InputMaybe<Scalars["String"]["input"]>;
  type?: InputMaybe<Scalars["String"]["input"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
};

/** update columns of table "badma.tournaments" */
export enum Badma_Tournaments_Update_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Id = "id",
  /** column name */
  Status = "status",
  /** column name */
  Type = "type",
  /** column name */
  UpdatedAt = "updated_at",
}

export type Badma_Tournaments_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Badma_Tournaments_Set_Input>;
  /** filter the rows which have to be updated */
  where: Badma_Tournaments_Bool_Exp;
};

/** Boolean expression to compare columns of type "bigint". All fields are combined with logical 'AND'. */
export type Bigint_Comparison_Exp = {
  _eq?: InputMaybe<Scalars["bigint"]["input"]>;
  _gt?: InputMaybe<Scalars["bigint"]["input"]>;
  _gte?: InputMaybe<Scalars["bigint"]["input"]>;
  _in?: InputMaybe<Array<Scalars["bigint"]["input"]>>;
  _is_null?: InputMaybe<Scalars["Boolean"]["input"]>;
  _lt?: InputMaybe<Scalars["bigint"]["input"]>;
  _lte?: InputMaybe<Scalars["bigint"]["input"]>;
  _neq?: InputMaybe<Scalars["bigint"]["input"]>;
  _nin?: InputMaybe<Array<Scalars["bigint"]["input"]>>;
};

/** ordering argument of a cursor */
export enum Cursor_Ordering {
  /** ascending ordering of the cursor */
  Asc = "ASC",
  /** descending ordering of the cursor */
  Desc = "DESC",
}

/** columns and relationships of "debug" */
export type Debug = {
  __typename?: "debug";
  created_at: Scalars["timestamptz"]["output"];
  id: Scalars["uuid"]["output"];
  value?: Maybe<Scalars["jsonb"]["output"]>;
};

/** columns and relationships of "debug" */
export type DebugValueArgs = {
  path?: InputMaybe<Scalars["String"]["input"]>;
};

/** aggregated selection of "debug" */
export type Debug_Aggregate = {
  __typename?: "debug_aggregate";
  aggregate?: Maybe<Debug_Aggregate_Fields>;
  nodes: Array<Debug>;
};

/** aggregate fields of "debug" */
export type Debug_Aggregate_Fields = {
  __typename?: "debug_aggregate_fields";
  count: Scalars["Int"]["output"];
  max?: Maybe<Debug_Max_Fields>;
  min?: Maybe<Debug_Min_Fields>;
};

/** aggregate fields of "debug" */
export type Debug_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Debug_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]["input"]>;
};

/** append existing jsonb value of filtered columns with new jsonb value */
export type Debug_Append_Input = {
  value?: InputMaybe<Scalars["jsonb"]["input"]>;
};

/** Boolean expression to filter rows from the table "debug". All fields are combined with a logical 'AND'. */
export type Debug_Bool_Exp = {
  _and?: InputMaybe<Array<Debug_Bool_Exp>>;
  _not?: InputMaybe<Debug_Bool_Exp>;
  _or?: InputMaybe<Array<Debug_Bool_Exp>>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  value?: InputMaybe<Jsonb_Comparison_Exp>;
};

/** unique or primary key constraints on table "debug" */
export enum Debug_Constraint {
  /** unique or primary key constraint on columns "id" */
  DebugPkey = "debug_pkey",
}

/** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
export type Debug_Delete_At_Path_Input = {
  value?: InputMaybe<Array<Scalars["String"]["input"]>>;
};

/** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
export type Debug_Delete_Elem_Input = {
  value?: InputMaybe<Scalars["Int"]["input"]>;
};

/** delete key/value pair or string element. key/value pairs are matched based on their key value */
export type Debug_Delete_Key_Input = {
  value?: InputMaybe<Scalars["String"]["input"]>;
};

/** input type for inserting data into table "debug" */
export type Debug_Insert_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  value?: InputMaybe<Scalars["jsonb"]["input"]>;
};

/** aggregate max on columns */
export type Debug_Max_Fields = {
  __typename?: "debug_max_fields";
  created_at?: Maybe<Scalars["timestamptz"]["output"]>;
  id?: Maybe<Scalars["uuid"]["output"]>;
};

/** aggregate min on columns */
export type Debug_Min_Fields = {
  __typename?: "debug_min_fields";
  created_at?: Maybe<Scalars["timestamptz"]["output"]>;
  id?: Maybe<Scalars["uuid"]["output"]>;
};

/** response of any mutation on the table "debug" */
export type Debug_Mutation_Response = {
  __typename?: "debug_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"]["output"];
  /** data from the rows affected by the mutation */
  returning: Array<Debug>;
};

/** on_conflict condition type for table "debug" */
export type Debug_On_Conflict = {
  constraint: Debug_Constraint;
  update_columns?: Array<Debug_Update_Column>;
  where?: InputMaybe<Debug_Bool_Exp>;
};

/** Ordering options when selecting data from "debug". */
export type Debug_Order_By = {
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  value?: InputMaybe<Order_By>;
};

/** primary key columns input for table: debug */
export type Debug_Pk_Columns_Input = {
  id: Scalars["uuid"]["input"];
};

/** prepend existing jsonb value of filtered columns with new jsonb value */
export type Debug_Prepend_Input = {
  value?: InputMaybe<Scalars["jsonb"]["input"]>;
};

/** select columns of table "debug" */
export enum Debug_Select_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Id = "id",
  /** column name */
  Value = "value",
}

/** input type for updating data in table "debug" */
export type Debug_Set_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  value?: InputMaybe<Scalars["jsonb"]["input"]>;
};

/** Streaming cursor of the table "debug" */
export type Debug_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Debug_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Debug_Stream_Cursor_Value_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  value?: InputMaybe<Scalars["jsonb"]["input"]>;
};

/** update columns of table "debug" */
export enum Debug_Update_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Id = "id",
  /** column name */
  Value = "value",
}

export type Debug_Updates = {
  /** append existing jsonb value of filtered columns with new jsonb value */
  _append?: InputMaybe<Debug_Append_Input>;
  /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
  _delete_at_path?: InputMaybe<Debug_Delete_At_Path_Input>;
  /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
  _delete_elem?: InputMaybe<Debug_Delete_Elem_Input>;
  /** delete key/value pair or string element. key/value pairs are matched based on their key value */
  _delete_key?: InputMaybe<Debug_Delete_Key_Input>;
  /** prepend existing jsonb value of filtered columns with new jsonb value */
  _prepend?: InputMaybe<Debug_Prepend_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Debug_Set_Input>;
  /** filter the rows which have to be updated */
  where: Debug_Bool_Exp;
};

export type Jsonb_Cast_Exp = {
  String?: InputMaybe<String_Comparison_Exp>;
};

/** Boolean expression to compare columns of type "jsonb". All fields are combined with logical 'AND'. */
export type Jsonb_Comparison_Exp = {
  _cast?: InputMaybe<Jsonb_Cast_Exp>;
  /** is the column contained in the given json value */
  _contained_in?: InputMaybe<Scalars["jsonb"]["input"]>;
  /** does the column contain the given json value at the top level */
  _contains?: InputMaybe<Scalars["jsonb"]["input"]>;
  _eq?: InputMaybe<Scalars["jsonb"]["input"]>;
  _gt?: InputMaybe<Scalars["jsonb"]["input"]>;
  _gte?: InputMaybe<Scalars["jsonb"]["input"]>;
  /** does the string exist as a top-level key in the column */
  _has_key?: InputMaybe<Scalars["String"]["input"]>;
  /** do all of these strings exist as top-level keys in the column */
  _has_keys_all?: InputMaybe<Array<Scalars["String"]["input"]>>;
  /** do any of these strings exist as top-level keys in the column */
  _has_keys_any?: InputMaybe<Array<Scalars["String"]["input"]>>;
  _in?: InputMaybe<Array<Scalars["jsonb"]["input"]>>;
  _is_null?: InputMaybe<Scalars["Boolean"]["input"]>;
  _lt?: InputMaybe<Scalars["jsonb"]["input"]>;
  _lte?: InputMaybe<Scalars["jsonb"]["input"]>;
  _neq?: InputMaybe<Scalars["jsonb"]["input"]>;
  _nin?: InputMaybe<Array<Scalars["jsonb"]["input"]>>;
};

/** mutation root */
export type Mutation_Root = {
  __typename?: "mutation_root";
  /** delete data from the table: "accounts" */
  delete_accounts?: Maybe<Accounts_Mutation_Response>;
  /** delete single row from the table: "accounts" */
  delete_accounts_by_pk?: Maybe<Accounts>;
  /** delete data from the table: "badma.ais" */
  delete_badma_ais?: Maybe<Badma_Ais_Mutation_Response>;
  /** delete single row from the table: "badma.ais" */
  delete_badma_ais_by_pk?: Maybe<Badma_Ais>;
  /** delete data from the table: "badma.errors" */
  delete_badma_errors?: Maybe<Badma_Errors_Mutation_Response>;
  /** delete single row from the table: "badma.errors" */
  delete_badma_errors_by_pk?: Maybe<Badma_Errors>;
  /** delete data from the table: "badma.games" */
  delete_badma_games?: Maybe<Badma_Games_Mutation_Response>;
  /** delete single row from the table: "badma.games" */
  delete_badma_games_by_pk?: Maybe<Badma_Games>;
  /** delete data from the table: "badma.joins" */
  delete_badma_joins?: Maybe<Badma_Joins_Mutation_Response>;
  /** delete single row from the table: "badma.joins" */
  delete_badma_joins_by_pk?: Maybe<Badma_Joins>;
  /** delete data from the table: "badma.moves" */
  delete_badma_moves?: Maybe<Badma_Moves_Mutation_Response>;
  /** delete single row from the table: "badma.moves" */
  delete_badma_moves_by_pk?: Maybe<Badma_Moves>;
  /** delete data from the table: "badma.servers" */
  delete_badma_servers?: Maybe<Badma_Servers_Mutation_Response>;
  /** delete single row from the table: "badma.servers" */
  delete_badma_servers_by_pk?: Maybe<Badma_Servers>;
  /** delete data from the table: "badma.tournament_games" */
  delete_badma_tournament_games?: Maybe<Badma_Tournament_Games_Mutation_Response>;
  /** delete single row from the table: "badma.tournament_games" */
  delete_badma_tournament_games_by_pk?: Maybe<Badma_Tournament_Games>;
  /** delete data from the table: "badma.tournament_participants" */
  delete_badma_tournament_participants?: Maybe<Badma_Tournament_Participants_Mutation_Response>;
  /** delete single row from the table: "badma.tournament_participants" */
  delete_badma_tournament_participants_by_pk?: Maybe<Badma_Tournament_Participants>;
  /** delete data from the table: "badma.tournament_scores" */
  delete_badma_tournament_scores?: Maybe<Badma_Tournament_Scores_Mutation_Response>;
  /** delete single row from the table: "badma.tournament_scores" */
  delete_badma_tournament_scores_by_pk?: Maybe<Badma_Tournament_Scores>;
  /** delete data from the table: "badma.tournaments" */
  delete_badma_tournaments?: Maybe<Badma_Tournaments_Mutation_Response>;
  /** delete single row from the table: "badma.tournaments" */
  delete_badma_tournaments_by_pk?: Maybe<Badma_Tournaments>;
  /** delete data from the table: "debug" */
  delete_debug?: Maybe<Debug_Mutation_Response>;
  /** delete single row from the table: "debug" */
  delete_debug_by_pk?: Maybe<Debug>;
  /** delete data from the table: "notification_messages" */
  delete_notification_messages?: Maybe<Notification_Messages_Mutation_Response>;
  /** delete single row from the table: "notification_messages" */
  delete_notification_messages_by_pk?: Maybe<Notification_Messages>;
  /** delete data from the table: "notification_permissions" */
  delete_notification_permissions?: Maybe<Notification_Permissions_Mutation_Response>;
  /** delete single row from the table: "notification_permissions" */
  delete_notification_permissions_by_pk?: Maybe<Notification_Permissions>;
  /** delete data from the table: "notifications" */
  delete_notifications?: Maybe<Notifications_Mutation_Response>;
  /** delete single row from the table: "notifications" */
  delete_notifications_by_pk?: Maybe<Notifications>;
  /** delete data from the table: "users" */
  delete_users?: Maybe<Users_Mutation_Response>;
  /** delete single row from the table: "users" */
  delete_users_by_pk?: Maybe<Users>;
  /** insert data into the table: "accounts" */
  insert_accounts?: Maybe<Accounts_Mutation_Response>;
  /** insert a single row into the table: "accounts" */
  insert_accounts_one?: Maybe<Accounts>;
  /** insert data into the table: "badma.ais" */
  insert_badma_ais?: Maybe<Badma_Ais_Mutation_Response>;
  /** insert a single row into the table: "badma.ais" */
  insert_badma_ais_one?: Maybe<Badma_Ais>;
  /** insert data into the table: "badma.errors" */
  insert_badma_errors?: Maybe<Badma_Errors_Mutation_Response>;
  /** insert a single row into the table: "badma.errors" */
  insert_badma_errors_one?: Maybe<Badma_Errors>;
  /** insert data into the table: "badma.games" */
  insert_badma_games?: Maybe<Badma_Games_Mutation_Response>;
  /** insert a single row into the table: "badma.games" */
  insert_badma_games_one?: Maybe<Badma_Games>;
  /** insert data into the table: "badma.joins" */
  insert_badma_joins?: Maybe<Badma_Joins_Mutation_Response>;
  /** insert a single row into the table: "badma.joins" */
  insert_badma_joins_one?: Maybe<Badma_Joins>;
  /** insert data into the table: "badma.moves" */
  insert_badma_moves?: Maybe<Badma_Moves_Mutation_Response>;
  /** insert a single row into the table: "badma.moves" */
  insert_badma_moves_one?: Maybe<Badma_Moves>;
  /** insert data into the table: "badma.servers" */
  insert_badma_servers?: Maybe<Badma_Servers_Mutation_Response>;
  /** insert a single row into the table: "badma.servers" */
  insert_badma_servers_one?: Maybe<Badma_Servers>;
  /** insert data into the table: "badma.tournament_games" */
  insert_badma_tournament_games?: Maybe<Badma_Tournament_Games_Mutation_Response>;
  /** insert a single row into the table: "badma.tournament_games" */
  insert_badma_tournament_games_one?: Maybe<Badma_Tournament_Games>;
  /** insert data into the table: "badma.tournament_participants" */
  insert_badma_tournament_participants?: Maybe<Badma_Tournament_Participants_Mutation_Response>;
  /** insert a single row into the table: "badma.tournament_participants" */
  insert_badma_tournament_participants_one?: Maybe<Badma_Tournament_Participants>;
  /** insert data into the table: "badma.tournament_scores" */
  insert_badma_tournament_scores?: Maybe<Badma_Tournament_Scores_Mutation_Response>;
  /** insert a single row into the table: "badma.tournament_scores" */
  insert_badma_tournament_scores_one?: Maybe<Badma_Tournament_Scores>;
  /** insert data into the table: "badma.tournaments" */
  insert_badma_tournaments?: Maybe<Badma_Tournaments_Mutation_Response>;
  /** insert a single row into the table: "badma.tournaments" */
  insert_badma_tournaments_one?: Maybe<Badma_Tournaments>;
  /** insert data into the table: "debug" */
  insert_debug?: Maybe<Debug_Mutation_Response>;
  /** insert a single row into the table: "debug" */
  insert_debug_one?: Maybe<Debug>;
  /** insert data into the table: "notification_messages" */
  insert_notification_messages?: Maybe<Notification_Messages_Mutation_Response>;
  /** insert a single row into the table: "notification_messages" */
  insert_notification_messages_one?: Maybe<Notification_Messages>;
  /** insert data into the table: "notification_permissions" */
  insert_notification_permissions?: Maybe<Notification_Permissions_Mutation_Response>;
  /** insert a single row into the table: "notification_permissions" */
  insert_notification_permissions_one?: Maybe<Notification_Permissions>;
  /** insert data into the table: "notifications" */
  insert_notifications?: Maybe<Notifications_Mutation_Response>;
  /** insert a single row into the table: "notifications" */
  insert_notifications_one?: Maybe<Notifications>;
  /** insert data into the table: "users" */
  insert_users?: Maybe<Users_Mutation_Response>;
  /** insert a single row into the table: "users" */
  insert_users_one?: Maybe<Users>;
  /** update data of the table: "accounts" */
  update_accounts?: Maybe<Accounts_Mutation_Response>;
  /** update single row of the table: "accounts" */
  update_accounts_by_pk?: Maybe<Accounts>;
  /** update multiples rows of table: "accounts" */
  update_accounts_many?: Maybe<Array<Maybe<Accounts_Mutation_Response>>>;
  /** update data of the table: "badma.ais" */
  update_badma_ais?: Maybe<Badma_Ais_Mutation_Response>;
  /** update single row of the table: "badma.ais" */
  update_badma_ais_by_pk?: Maybe<Badma_Ais>;
  /** update multiples rows of table: "badma.ais" */
  update_badma_ais_many?: Maybe<Array<Maybe<Badma_Ais_Mutation_Response>>>;
  /** update data of the table: "badma.errors" */
  update_badma_errors?: Maybe<Badma_Errors_Mutation_Response>;
  /** update single row of the table: "badma.errors" */
  update_badma_errors_by_pk?: Maybe<Badma_Errors>;
  /** update multiples rows of table: "badma.errors" */
  update_badma_errors_many?: Maybe<
    Array<Maybe<Badma_Errors_Mutation_Response>>
  >;
  /** update data of the table: "badma.games" */
  update_badma_games?: Maybe<Badma_Games_Mutation_Response>;
  /** update single row of the table: "badma.games" */
  update_badma_games_by_pk?: Maybe<Badma_Games>;
  /** update multiples rows of table: "badma.games" */
  update_badma_games_many?: Maybe<Array<Maybe<Badma_Games_Mutation_Response>>>;
  /** update data of the table: "badma.joins" */
  update_badma_joins?: Maybe<Badma_Joins_Mutation_Response>;
  /** update single row of the table: "badma.joins" */
  update_badma_joins_by_pk?: Maybe<Badma_Joins>;
  /** update multiples rows of table: "badma.joins" */
  update_badma_joins_many?: Maybe<Array<Maybe<Badma_Joins_Mutation_Response>>>;
  /** update data of the table: "badma.moves" */
  update_badma_moves?: Maybe<Badma_Moves_Mutation_Response>;
  /** update single row of the table: "badma.moves" */
  update_badma_moves_by_pk?: Maybe<Badma_Moves>;
  /** update multiples rows of table: "badma.moves" */
  update_badma_moves_many?: Maybe<Array<Maybe<Badma_Moves_Mutation_Response>>>;
  /** update data of the table: "badma.servers" */
  update_badma_servers?: Maybe<Badma_Servers_Mutation_Response>;
  /** update single row of the table: "badma.servers" */
  update_badma_servers_by_pk?: Maybe<Badma_Servers>;
  /** update multiples rows of table: "badma.servers" */
  update_badma_servers_many?: Maybe<
    Array<Maybe<Badma_Servers_Mutation_Response>>
  >;
  /** update data of the table: "badma.tournament_games" */
  update_badma_tournament_games?: Maybe<Badma_Tournament_Games_Mutation_Response>;
  /** update single row of the table: "badma.tournament_games" */
  update_badma_tournament_games_by_pk?: Maybe<Badma_Tournament_Games>;
  /** update multiples rows of table: "badma.tournament_games" */
  update_badma_tournament_games_many?: Maybe<
    Array<Maybe<Badma_Tournament_Games_Mutation_Response>>
  >;
  /** update data of the table: "badma.tournament_participants" */
  update_badma_tournament_participants?: Maybe<Badma_Tournament_Participants_Mutation_Response>;
  /** update single row of the table: "badma.tournament_participants" */
  update_badma_tournament_participants_by_pk?: Maybe<Badma_Tournament_Participants>;
  /** update multiples rows of table: "badma.tournament_participants" */
  update_badma_tournament_participants_many?: Maybe<
    Array<Maybe<Badma_Tournament_Participants_Mutation_Response>>
  >;
  /** update data of the table: "badma.tournament_scores" */
  update_badma_tournament_scores?: Maybe<Badma_Tournament_Scores_Mutation_Response>;
  /** update single row of the table: "badma.tournament_scores" */
  update_badma_tournament_scores_by_pk?: Maybe<Badma_Tournament_Scores>;
  /** update multiples rows of table: "badma.tournament_scores" */
  update_badma_tournament_scores_many?: Maybe<
    Array<Maybe<Badma_Tournament_Scores_Mutation_Response>>
  >;
  /** update data of the table: "badma.tournaments" */
  update_badma_tournaments?: Maybe<Badma_Tournaments_Mutation_Response>;
  /** update single row of the table: "badma.tournaments" */
  update_badma_tournaments_by_pk?: Maybe<Badma_Tournaments>;
  /** update multiples rows of table: "badma.tournaments" */
  update_badma_tournaments_many?: Maybe<
    Array<Maybe<Badma_Tournaments_Mutation_Response>>
  >;
  /** update data of the table: "debug" */
  update_debug?: Maybe<Debug_Mutation_Response>;
  /** update single row of the table: "debug" */
  update_debug_by_pk?: Maybe<Debug>;
  /** update multiples rows of table: "debug" */
  update_debug_many?: Maybe<Array<Maybe<Debug_Mutation_Response>>>;
  /** update data of the table: "notification_messages" */
  update_notification_messages?: Maybe<Notification_Messages_Mutation_Response>;
  /** update single row of the table: "notification_messages" */
  update_notification_messages_by_pk?: Maybe<Notification_Messages>;
  /** update multiples rows of table: "notification_messages" */
  update_notification_messages_many?: Maybe<
    Array<Maybe<Notification_Messages_Mutation_Response>>
  >;
  /** update data of the table: "notification_permissions" */
  update_notification_permissions?: Maybe<Notification_Permissions_Mutation_Response>;
  /** update single row of the table: "notification_permissions" */
  update_notification_permissions_by_pk?: Maybe<Notification_Permissions>;
  /** update multiples rows of table: "notification_permissions" */
  update_notification_permissions_many?: Maybe<
    Array<Maybe<Notification_Permissions_Mutation_Response>>
  >;
  /** update data of the table: "notifications" */
  update_notifications?: Maybe<Notifications_Mutation_Response>;
  /** update single row of the table: "notifications" */
  update_notifications_by_pk?: Maybe<Notifications>;
  /** update multiples rows of table: "notifications" */
  update_notifications_many?: Maybe<
    Array<Maybe<Notifications_Mutation_Response>>
  >;
  /** update data of the table: "users" */
  update_users?: Maybe<Users_Mutation_Response>;
  /** update single row of the table: "users" */
  update_users_by_pk?: Maybe<Users>;
  /** update multiples rows of table: "users" */
  update_users_many?: Maybe<Array<Maybe<Users_Mutation_Response>>>;
};

/** mutation root */
export type Mutation_RootDelete_AccountsArgs = {
  where: Accounts_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Accounts_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

/** mutation root */
export type Mutation_RootDelete_Badma_AisArgs = {
  where: Badma_Ais_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Badma_Ais_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

/** mutation root */
export type Mutation_RootDelete_Badma_ErrorsArgs = {
  where: Badma_Errors_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Badma_Errors_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

/** mutation root */
export type Mutation_RootDelete_Badma_GamesArgs = {
  where: Badma_Games_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Badma_Games_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

/** mutation root */
export type Mutation_RootDelete_Badma_JoinsArgs = {
  where: Badma_Joins_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Badma_Joins_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

/** mutation root */
export type Mutation_RootDelete_Badma_MovesArgs = {
  where: Badma_Moves_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Badma_Moves_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

/** mutation root */
export type Mutation_RootDelete_Badma_ServersArgs = {
  where: Badma_Servers_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Badma_Servers_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

/** mutation root */
export type Mutation_RootDelete_Badma_Tournament_GamesArgs = {
  where: Badma_Tournament_Games_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Badma_Tournament_Games_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

/** mutation root */
export type Mutation_RootDelete_Badma_Tournament_ParticipantsArgs = {
  where: Badma_Tournament_Participants_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Badma_Tournament_Participants_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

/** mutation root */
export type Mutation_RootDelete_Badma_Tournament_ScoresArgs = {
  where: Badma_Tournament_Scores_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Badma_Tournament_Scores_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

/** mutation root */
export type Mutation_RootDelete_Badma_TournamentsArgs = {
  where: Badma_Tournaments_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Badma_Tournaments_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

/** mutation root */
export type Mutation_RootDelete_DebugArgs = {
  where: Debug_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Debug_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

/** mutation root */
export type Mutation_RootDelete_Notification_MessagesArgs = {
  where: Notification_Messages_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Notification_Messages_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

/** mutation root */
export type Mutation_RootDelete_Notification_PermissionsArgs = {
  where: Notification_Permissions_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Notification_Permissions_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

/** mutation root */
export type Mutation_RootDelete_NotificationsArgs = {
  where: Notifications_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Notifications_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

/** mutation root */
export type Mutation_RootDelete_UsersArgs = {
  where: Users_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Users_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

/** mutation root */
export type Mutation_RootInsert_AccountsArgs = {
  objects: Array<Accounts_Insert_Input>;
  on_conflict?: InputMaybe<Accounts_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Accounts_OneArgs = {
  object: Accounts_Insert_Input;
  on_conflict?: InputMaybe<Accounts_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Badma_AisArgs = {
  objects: Array<Badma_Ais_Insert_Input>;
  on_conflict?: InputMaybe<Badma_Ais_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Badma_Ais_OneArgs = {
  object: Badma_Ais_Insert_Input;
  on_conflict?: InputMaybe<Badma_Ais_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Badma_ErrorsArgs = {
  objects: Array<Badma_Errors_Insert_Input>;
  on_conflict?: InputMaybe<Badma_Errors_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Badma_Errors_OneArgs = {
  object: Badma_Errors_Insert_Input;
  on_conflict?: InputMaybe<Badma_Errors_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Badma_GamesArgs = {
  objects: Array<Badma_Games_Insert_Input>;
  on_conflict?: InputMaybe<Badma_Games_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Badma_Games_OneArgs = {
  object: Badma_Games_Insert_Input;
  on_conflict?: InputMaybe<Badma_Games_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Badma_JoinsArgs = {
  objects: Array<Badma_Joins_Insert_Input>;
  on_conflict?: InputMaybe<Badma_Joins_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Badma_Joins_OneArgs = {
  object: Badma_Joins_Insert_Input;
  on_conflict?: InputMaybe<Badma_Joins_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Badma_MovesArgs = {
  objects: Array<Badma_Moves_Insert_Input>;
  on_conflict?: InputMaybe<Badma_Moves_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Badma_Moves_OneArgs = {
  object: Badma_Moves_Insert_Input;
  on_conflict?: InputMaybe<Badma_Moves_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Badma_ServersArgs = {
  objects: Array<Badma_Servers_Insert_Input>;
  on_conflict?: InputMaybe<Badma_Servers_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Badma_Servers_OneArgs = {
  object: Badma_Servers_Insert_Input;
  on_conflict?: InputMaybe<Badma_Servers_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Badma_Tournament_GamesArgs = {
  objects: Array<Badma_Tournament_Games_Insert_Input>;
  on_conflict?: InputMaybe<Badma_Tournament_Games_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Badma_Tournament_Games_OneArgs = {
  object: Badma_Tournament_Games_Insert_Input;
  on_conflict?: InputMaybe<Badma_Tournament_Games_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Badma_Tournament_ParticipantsArgs = {
  objects: Array<Badma_Tournament_Participants_Insert_Input>;
  on_conflict?: InputMaybe<Badma_Tournament_Participants_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Badma_Tournament_Participants_OneArgs = {
  object: Badma_Tournament_Participants_Insert_Input;
  on_conflict?: InputMaybe<Badma_Tournament_Participants_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Badma_Tournament_ScoresArgs = {
  objects: Array<Badma_Tournament_Scores_Insert_Input>;
  on_conflict?: InputMaybe<Badma_Tournament_Scores_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Badma_Tournament_Scores_OneArgs = {
  object: Badma_Tournament_Scores_Insert_Input;
  on_conflict?: InputMaybe<Badma_Tournament_Scores_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Badma_TournamentsArgs = {
  objects: Array<Badma_Tournaments_Insert_Input>;
  on_conflict?: InputMaybe<Badma_Tournaments_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Badma_Tournaments_OneArgs = {
  object: Badma_Tournaments_Insert_Input;
  on_conflict?: InputMaybe<Badma_Tournaments_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_DebugArgs = {
  objects: Array<Debug_Insert_Input>;
  on_conflict?: InputMaybe<Debug_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Debug_OneArgs = {
  object: Debug_Insert_Input;
  on_conflict?: InputMaybe<Debug_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Notification_MessagesArgs = {
  objects: Array<Notification_Messages_Insert_Input>;
  on_conflict?: InputMaybe<Notification_Messages_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Notification_Messages_OneArgs = {
  object: Notification_Messages_Insert_Input;
  on_conflict?: InputMaybe<Notification_Messages_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Notification_PermissionsArgs = {
  objects: Array<Notification_Permissions_Insert_Input>;
  on_conflict?: InputMaybe<Notification_Permissions_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Notification_Permissions_OneArgs = {
  object: Notification_Permissions_Insert_Input;
  on_conflict?: InputMaybe<Notification_Permissions_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_NotificationsArgs = {
  objects: Array<Notifications_Insert_Input>;
  on_conflict?: InputMaybe<Notifications_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Notifications_OneArgs = {
  object: Notifications_Insert_Input;
  on_conflict?: InputMaybe<Notifications_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_UsersArgs = {
  objects: Array<Users_Insert_Input>;
  on_conflict?: InputMaybe<Users_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Users_OneArgs = {
  object: Users_Insert_Input;
  on_conflict?: InputMaybe<Users_On_Conflict>;
};

/** mutation root */
export type Mutation_RootUpdate_AccountsArgs = {
  _inc?: InputMaybe<Accounts_Inc_Input>;
  _set?: InputMaybe<Accounts_Set_Input>;
  where: Accounts_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Accounts_By_PkArgs = {
  _inc?: InputMaybe<Accounts_Inc_Input>;
  _set?: InputMaybe<Accounts_Set_Input>;
  pk_columns: Accounts_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Accounts_ManyArgs = {
  updates: Array<Accounts_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_Badma_AisArgs = {
  _append?: InputMaybe<Badma_Ais_Append_Input>;
  _delete_at_path?: InputMaybe<Badma_Ais_Delete_At_Path_Input>;
  _delete_elem?: InputMaybe<Badma_Ais_Delete_Elem_Input>;
  _delete_key?: InputMaybe<Badma_Ais_Delete_Key_Input>;
  _prepend?: InputMaybe<Badma_Ais_Prepend_Input>;
  _set?: InputMaybe<Badma_Ais_Set_Input>;
  where: Badma_Ais_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Badma_Ais_By_PkArgs = {
  _append?: InputMaybe<Badma_Ais_Append_Input>;
  _delete_at_path?: InputMaybe<Badma_Ais_Delete_At_Path_Input>;
  _delete_elem?: InputMaybe<Badma_Ais_Delete_Elem_Input>;
  _delete_key?: InputMaybe<Badma_Ais_Delete_Key_Input>;
  _prepend?: InputMaybe<Badma_Ais_Prepend_Input>;
  _set?: InputMaybe<Badma_Ais_Set_Input>;
  pk_columns: Badma_Ais_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Badma_Ais_ManyArgs = {
  updates: Array<Badma_Ais_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_Badma_ErrorsArgs = {
  _append?: InputMaybe<Badma_Errors_Append_Input>;
  _delete_at_path?: InputMaybe<Badma_Errors_Delete_At_Path_Input>;
  _delete_elem?: InputMaybe<Badma_Errors_Delete_Elem_Input>;
  _delete_key?: InputMaybe<Badma_Errors_Delete_Key_Input>;
  _prepend?: InputMaybe<Badma_Errors_Prepend_Input>;
  _set?: InputMaybe<Badma_Errors_Set_Input>;
  where: Badma_Errors_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Badma_Errors_By_PkArgs = {
  _append?: InputMaybe<Badma_Errors_Append_Input>;
  _delete_at_path?: InputMaybe<Badma_Errors_Delete_At_Path_Input>;
  _delete_elem?: InputMaybe<Badma_Errors_Delete_Elem_Input>;
  _delete_key?: InputMaybe<Badma_Errors_Delete_Key_Input>;
  _prepend?: InputMaybe<Badma_Errors_Prepend_Input>;
  _set?: InputMaybe<Badma_Errors_Set_Input>;
  pk_columns: Badma_Errors_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Badma_Errors_ManyArgs = {
  updates: Array<Badma_Errors_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_Badma_GamesArgs = {
  _inc?: InputMaybe<Badma_Games_Inc_Input>;
  _set?: InputMaybe<Badma_Games_Set_Input>;
  where: Badma_Games_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Badma_Games_By_PkArgs = {
  _inc?: InputMaybe<Badma_Games_Inc_Input>;
  _set?: InputMaybe<Badma_Games_Set_Input>;
  pk_columns: Badma_Games_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Badma_Games_ManyArgs = {
  updates: Array<Badma_Games_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_Badma_JoinsArgs = {
  _inc?: InputMaybe<Badma_Joins_Inc_Input>;
  _set?: InputMaybe<Badma_Joins_Set_Input>;
  where: Badma_Joins_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Badma_Joins_By_PkArgs = {
  _inc?: InputMaybe<Badma_Joins_Inc_Input>;
  _set?: InputMaybe<Badma_Joins_Set_Input>;
  pk_columns: Badma_Joins_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Badma_Joins_ManyArgs = {
  updates: Array<Badma_Joins_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_Badma_MovesArgs = {
  _inc?: InputMaybe<Badma_Moves_Inc_Input>;
  _set?: InputMaybe<Badma_Moves_Set_Input>;
  where: Badma_Moves_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Badma_Moves_By_PkArgs = {
  _inc?: InputMaybe<Badma_Moves_Inc_Input>;
  _set?: InputMaybe<Badma_Moves_Set_Input>;
  pk_columns: Badma_Moves_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Badma_Moves_ManyArgs = {
  updates: Array<Badma_Moves_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_Badma_ServersArgs = {
  _set?: InputMaybe<Badma_Servers_Set_Input>;
  where: Badma_Servers_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Badma_Servers_By_PkArgs = {
  _set?: InputMaybe<Badma_Servers_Set_Input>;
  pk_columns: Badma_Servers_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Badma_Servers_ManyArgs = {
  updates: Array<Badma_Servers_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_Badma_Tournament_GamesArgs = {
  _set?: InputMaybe<Badma_Tournament_Games_Set_Input>;
  where: Badma_Tournament_Games_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Badma_Tournament_Games_By_PkArgs = {
  _set?: InputMaybe<Badma_Tournament_Games_Set_Input>;
  pk_columns: Badma_Tournament_Games_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Badma_Tournament_Games_ManyArgs = {
  updates: Array<Badma_Tournament_Games_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_Badma_Tournament_ParticipantsArgs = {
  _inc?: InputMaybe<Badma_Tournament_Participants_Inc_Input>;
  _set?: InputMaybe<Badma_Tournament_Participants_Set_Input>;
  where: Badma_Tournament_Participants_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Badma_Tournament_Participants_By_PkArgs = {
  _inc?: InputMaybe<Badma_Tournament_Participants_Inc_Input>;
  _set?: InputMaybe<Badma_Tournament_Participants_Set_Input>;
  pk_columns: Badma_Tournament_Participants_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Badma_Tournament_Participants_ManyArgs = {
  updates: Array<Badma_Tournament_Participants_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_Badma_Tournament_ScoresArgs = {
  _inc?: InputMaybe<Badma_Tournament_Scores_Inc_Input>;
  _set?: InputMaybe<Badma_Tournament_Scores_Set_Input>;
  where: Badma_Tournament_Scores_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Badma_Tournament_Scores_By_PkArgs = {
  _inc?: InputMaybe<Badma_Tournament_Scores_Inc_Input>;
  _set?: InputMaybe<Badma_Tournament_Scores_Set_Input>;
  pk_columns: Badma_Tournament_Scores_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Badma_Tournament_Scores_ManyArgs = {
  updates: Array<Badma_Tournament_Scores_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_Badma_TournamentsArgs = {
  _set?: InputMaybe<Badma_Tournaments_Set_Input>;
  where: Badma_Tournaments_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Badma_Tournaments_By_PkArgs = {
  _set?: InputMaybe<Badma_Tournaments_Set_Input>;
  pk_columns: Badma_Tournaments_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Badma_Tournaments_ManyArgs = {
  updates: Array<Badma_Tournaments_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_DebugArgs = {
  _append?: InputMaybe<Debug_Append_Input>;
  _delete_at_path?: InputMaybe<Debug_Delete_At_Path_Input>;
  _delete_elem?: InputMaybe<Debug_Delete_Elem_Input>;
  _delete_key?: InputMaybe<Debug_Delete_Key_Input>;
  _prepend?: InputMaybe<Debug_Prepend_Input>;
  _set?: InputMaybe<Debug_Set_Input>;
  where: Debug_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Debug_By_PkArgs = {
  _append?: InputMaybe<Debug_Append_Input>;
  _delete_at_path?: InputMaybe<Debug_Delete_At_Path_Input>;
  _delete_elem?: InputMaybe<Debug_Delete_Elem_Input>;
  _delete_key?: InputMaybe<Debug_Delete_Key_Input>;
  _prepend?: InputMaybe<Debug_Prepend_Input>;
  _set?: InputMaybe<Debug_Set_Input>;
  pk_columns: Debug_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Debug_ManyArgs = {
  updates: Array<Debug_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_Notification_MessagesArgs = {
  _append?: InputMaybe<Notification_Messages_Append_Input>;
  _delete_at_path?: InputMaybe<Notification_Messages_Delete_At_Path_Input>;
  _delete_elem?: InputMaybe<Notification_Messages_Delete_Elem_Input>;
  _delete_key?: InputMaybe<Notification_Messages_Delete_Key_Input>;
  _prepend?: InputMaybe<Notification_Messages_Prepend_Input>;
  _set?: InputMaybe<Notification_Messages_Set_Input>;
  where: Notification_Messages_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Notification_Messages_By_PkArgs = {
  _append?: InputMaybe<Notification_Messages_Append_Input>;
  _delete_at_path?: InputMaybe<Notification_Messages_Delete_At_Path_Input>;
  _delete_elem?: InputMaybe<Notification_Messages_Delete_Elem_Input>;
  _delete_key?: InputMaybe<Notification_Messages_Delete_Key_Input>;
  _prepend?: InputMaybe<Notification_Messages_Prepend_Input>;
  _set?: InputMaybe<Notification_Messages_Set_Input>;
  pk_columns: Notification_Messages_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Notification_Messages_ManyArgs = {
  updates: Array<Notification_Messages_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_Notification_PermissionsArgs = {
  _append?: InputMaybe<Notification_Permissions_Append_Input>;
  _delete_at_path?: InputMaybe<Notification_Permissions_Delete_At_Path_Input>;
  _delete_elem?: InputMaybe<Notification_Permissions_Delete_Elem_Input>;
  _delete_key?: InputMaybe<Notification_Permissions_Delete_Key_Input>;
  _prepend?: InputMaybe<Notification_Permissions_Prepend_Input>;
  _set?: InputMaybe<Notification_Permissions_Set_Input>;
  where: Notification_Permissions_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Notification_Permissions_By_PkArgs = {
  _append?: InputMaybe<Notification_Permissions_Append_Input>;
  _delete_at_path?: InputMaybe<Notification_Permissions_Delete_At_Path_Input>;
  _delete_elem?: InputMaybe<Notification_Permissions_Delete_Elem_Input>;
  _delete_key?: InputMaybe<Notification_Permissions_Delete_Key_Input>;
  _prepend?: InputMaybe<Notification_Permissions_Prepend_Input>;
  _set?: InputMaybe<Notification_Permissions_Set_Input>;
  pk_columns: Notification_Permissions_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Notification_Permissions_ManyArgs = {
  updates: Array<Notification_Permissions_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_NotificationsArgs = {
  _append?: InputMaybe<Notifications_Append_Input>;
  _delete_at_path?: InputMaybe<Notifications_Delete_At_Path_Input>;
  _delete_elem?: InputMaybe<Notifications_Delete_Elem_Input>;
  _delete_key?: InputMaybe<Notifications_Delete_Key_Input>;
  _prepend?: InputMaybe<Notifications_Prepend_Input>;
  _set?: InputMaybe<Notifications_Set_Input>;
  where: Notifications_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Notifications_By_PkArgs = {
  _append?: InputMaybe<Notifications_Append_Input>;
  _delete_at_path?: InputMaybe<Notifications_Delete_At_Path_Input>;
  _delete_elem?: InputMaybe<Notifications_Delete_Elem_Input>;
  _delete_key?: InputMaybe<Notifications_Delete_Key_Input>;
  _prepend?: InputMaybe<Notifications_Prepend_Input>;
  _set?: InputMaybe<Notifications_Set_Input>;
  pk_columns: Notifications_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Notifications_ManyArgs = {
  updates: Array<Notifications_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_UsersArgs = {
  _set?: InputMaybe<Users_Set_Input>;
  where: Users_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Users_By_PkArgs = {
  _set?: InputMaybe<Users_Set_Input>;
  pk_columns: Users_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Users_ManyArgs = {
  updates: Array<Users_Updates>;
};

/** columns and relationships of "notification_messages" */
export type Notification_Messages = {
  __typename?: "notification_messages";
  body: Scalars["String"]["output"];
  created_at: Scalars["timestamptz"]["output"];
  data?: Maybe<Scalars["jsonb"]["output"]>;
  id: Scalars["uuid"]["output"];
  /** An array relationship */
  notifications: Array<Notifications>;
  /** An aggregate relationship */
  notifications_aggregate: Notifications_Aggregate;
  title: Scalars["String"]["output"];
  /** An object relationship */
  user: Users;
  user_id: Scalars["uuid"]["output"];
};

/** columns and relationships of "notification_messages" */
export type Notification_MessagesDataArgs = {
  path?: InputMaybe<Scalars["String"]["input"]>;
};

/** columns and relationships of "notification_messages" */
export type Notification_MessagesNotificationsArgs = {
  distinct_on?: InputMaybe<Array<Notifications_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Notifications_Order_By>>;
  where?: InputMaybe<Notifications_Bool_Exp>;
};

/** columns and relationships of "notification_messages" */
export type Notification_MessagesNotifications_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Notifications_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Notifications_Order_By>>;
  where?: InputMaybe<Notifications_Bool_Exp>;
};

/** aggregated selection of "notification_messages" */
export type Notification_Messages_Aggregate = {
  __typename?: "notification_messages_aggregate";
  aggregate?: Maybe<Notification_Messages_Aggregate_Fields>;
  nodes: Array<Notification_Messages>;
};

export type Notification_Messages_Aggregate_Bool_Exp = {
  count?: InputMaybe<Notification_Messages_Aggregate_Bool_Exp_Count>;
};

export type Notification_Messages_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Notification_Messages_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]["input"]>;
  filter?: InputMaybe<Notification_Messages_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "notification_messages" */
export type Notification_Messages_Aggregate_Fields = {
  __typename?: "notification_messages_aggregate_fields";
  count: Scalars["Int"]["output"];
  max?: Maybe<Notification_Messages_Max_Fields>;
  min?: Maybe<Notification_Messages_Min_Fields>;
};

/** aggregate fields of "notification_messages" */
export type Notification_Messages_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Notification_Messages_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]["input"]>;
};

/** order by aggregate values of table "notification_messages" */
export type Notification_Messages_Aggregate_Order_By = {
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Notification_Messages_Max_Order_By>;
  min?: InputMaybe<Notification_Messages_Min_Order_By>;
};

/** append existing jsonb value of filtered columns with new jsonb value */
export type Notification_Messages_Append_Input = {
  data?: InputMaybe<Scalars["jsonb"]["input"]>;
};

/** input type for inserting array relation for remote table "notification_messages" */
export type Notification_Messages_Arr_Rel_Insert_Input = {
  data: Array<Notification_Messages_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<Notification_Messages_On_Conflict>;
};

/** Boolean expression to filter rows from the table "notification_messages". All fields are combined with a logical 'AND'. */
export type Notification_Messages_Bool_Exp = {
  _and?: InputMaybe<Array<Notification_Messages_Bool_Exp>>;
  _not?: InputMaybe<Notification_Messages_Bool_Exp>;
  _or?: InputMaybe<Array<Notification_Messages_Bool_Exp>>;
  body?: InputMaybe<String_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  data?: InputMaybe<Jsonb_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  notifications?: InputMaybe<Notifications_Bool_Exp>;
  notifications_aggregate?: InputMaybe<Notifications_Aggregate_Bool_Exp>;
  title?: InputMaybe<String_Comparison_Exp>;
  user?: InputMaybe<Users_Bool_Exp>;
  user_id?: InputMaybe<Uuid_Comparison_Exp>;
};

/** unique or primary key constraints on table "notification_messages" */
export enum Notification_Messages_Constraint {
  /** unique or primary key constraint on columns "id" */
  NotificationMessagesPkey = "notification_messages_pkey",
}

/** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
export type Notification_Messages_Delete_At_Path_Input = {
  data?: InputMaybe<Array<Scalars["String"]["input"]>>;
};

/** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
export type Notification_Messages_Delete_Elem_Input = {
  data?: InputMaybe<Scalars["Int"]["input"]>;
};

/** delete key/value pair or string element. key/value pairs are matched based on their key value */
export type Notification_Messages_Delete_Key_Input = {
  data?: InputMaybe<Scalars["String"]["input"]>;
};

/** input type for inserting data into table "notification_messages" */
export type Notification_Messages_Insert_Input = {
  body?: InputMaybe<Scalars["String"]["input"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  data?: InputMaybe<Scalars["jsonb"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  notifications?: InputMaybe<Notifications_Arr_Rel_Insert_Input>;
  title?: InputMaybe<Scalars["String"]["input"]>;
  user?: InputMaybe<Users_Obj_Rel_Insert_Input>;
  user_id?: InputMaybe<Scalars["uuid"]["input"]>;
};

/** aggregate max on columns */
export type Notification_Messages_Max_Fields = {
  __typename?: "notification_messages_max_fields";
  body?: Maybe<Scalars["String"]["output"]>;
  created_at?: Maybe<Scalars["timestamptz"]["output"]>;
  id?: Maybe<Scalars["uuid"]["output"]>;
  title?: Maybe<Scalars["String"]["output"]>;
  user_id?: Maybe<Scalars["uuid"]["output"]>;
};

/** order by max() on columns of table "notification_messages" */
export type Notification_Messages_Max_Order_By = {
  body?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  title?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Notification_Messages_Min_Fields = {
  __typename?: "notification_messages_min_fields";
  body?: Maybe<Scalars["String"]["output"]>;
  created_at?: Maybe<Scalars["timestamptz"]["output"]>;
  id?: Maybe<Scalars["uuid"]["output"]>;
  title?: Maybe<Scalars["String"]["output"]>;
  user_id?: Maybe<Scalars["uuid"]["output"]>;
};

/** order by min() on columns of table "notification_messages" */
export type Notification_Messages_Min_Order_By = {
  body?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  title?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "notification_messages" */
export type Notification_Messages_Mutation_Response = {
  __typename?: "notification_messages_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"]["output"];
  /** data from the rows affected by the mutation */
  returning: Array<Notification_Messages>;
};

/** input type for inserting object relation for remote table "notification_messages" */
export type Notification_Messages_Obj_Rel_Insert_Input = {
  data: Notification_Messages_Insert_Input;
  /** upsert condition */
  on_conflict?: InputMaybe<Notification_Messages_On_Conflict>;
};

/** on_conflict condition type for table "notification_messages" */
export type Notification_Messages_On_Conflict = {
  constraint: Notification_Messages_Constraint;
  update_columns?: Array<Notification_Messages_Update_Column>;
  where?: InputMaybe<Notification_Messages_Bool_Exp>;
};

/** Ordering options when selecting data from "notification_messages". */
export type Notification_Messages_Order_By = {
  body?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  data?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  notifications_aggregate?: InputMaybe<Notifications_Aggregate_Order_By>;
  title?: InputMaybe<Order_By>;
  user?: InputMaybe<Users_Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** primary key columns input for table: notification_messages */
export type Notification_Messages_Pk_Columns_Input = {
  id: Scalars["uuid"]["input"];
};

/** prepend existing jsonb value of filtered columns with new jsonb value */
export type Notification_Messages_Prepend_Input = {
  data?: InputMaybe<Scalars["jsonb"]["input"]>;
};

/** select columns of table "notification_messages" */
export enum Notification_Messages_Select_Column {
  /** column name */
  Body = "body",
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Data = "data",
  /** column name */
  Id = "id",
  /** column name */
  Title = "title",
  /** column name */
  UserId = "user_id",
}

/** input type for updating data in table "notification_messages" */
export type Notification_Messages_Set_Input = {
  body?: InputMaybe<Scalars["String"]["input"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  data?: InputMaybe<Scalars["jsonb"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  title?: InputMaybe<Scalars["String"]["input"]>;
  user_id?: InputMaybe<Scalars["uuid"]["input"]>;
};

/** Streaming cursor of the table "notification_messages" */
export type Notification_Messages_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Notification_Messages_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Notification_Messages_Stream_Cursor_Value_Input = {
  body?: InputMaybe<Scalars["String"]["input"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  data?: InputMaybe<Scalars["jsonb"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  title?: InputMaybe<Scalars["String"]["input"]>;
  user_id?: InputMaybe<Scalars["uuid"]["input"]>;
};

/** update columns of table "notification_messages" */
export enum Notification_Messages_Update_Column {
  /** column name */
  Body = "body",
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Data = "data",
  /** column name */
  Id = "id",
  /** column name */
  Title = "title",
  /** column name */
  UserId = "user_id",
}

export type Notification_Messages_Updates = {
  /** append existing jsonb value of filtered columns with new jsonb value */
  _append?: InputMaybe<Notification_Messages_Append_Input>;
  /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
  _delete_at_path?: InputMaybe<Notification_Messages_Delete_At_Path_Input>;
  /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
  _delete_elem?: InputMaybe<Notification_Messages_Delete_Elem_Input>;
  /** delete key/value pair or string element. key/value pairs are matched based on their key value */
  _delete_key?: InputMaybe<Notification_Messages_Delete_Key_Input>;
  /** prepend existing jsonb value of filtered columns with new jsonb value */
  _prepend?: InputMaybe<Notification_Messages_Prepend_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Notification_Messages_Set_Input>;
  /** filter the rows which have to be updated */
  where: Notification_Messages_Bool_Exp;
};

/** columns and relationships of "notification_permissions" */
export type Notification_Permissions = {
  __typename?: "notification_permissions";
  created_at: Scalars["timestamptz"]["output"];
  device_info: Scalars["jsonb"]["output"];
  device_token: Scalars["String"]["output"];
  id: Scalars["uuid"]["output"];
  /** An array relationship */
  notifications: Array<Notifications>;
  /** An aggregate relationship */
  notifications_aggregate: Notifications_Aggregate;
  provider: Scalars["String"]["output"];
  updated_at: Scalars["timestamptz"]["output"];
  /** An object relationship */
  user: Users;
  user_id: Scalars["uuid"]["output"];
};

/** columns and relationships of "notification_permissions" */
export type Notification_PermissionsDevice_InfoArgs = {
  path?: InputMaybe<Scalars["String"]["input"]>;
};

/** columns and relationships of "notification_permissions" */
export type Notification_PermissionsNotificationsArgs = {
  distinct_on?: InputMaybe<Array<Notifications_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Notifications_Order_By>>;
  where?: InputMaybe<Notifications_Bool_Exp>;
};

/** columns and relationships of "notification_permissions" */
export type Notification_PermissionsNotifications_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Notifications_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Notifications_Order_By>>;
  where?: InputMaybe<Notifications_Bool_Exp>;
};

/** aggregated selection of "notification_permissions" */
export type Notification_Permissions_Aggregate = {
  __typename?: "notification_permissions_aggregate";
  aggregate?: Maybe<Notification_Permissions_Aggregate_Fields>;
  nodes: Array<Notification_Permissions>;
};

export type Notification_Permissions_Aggregate_Bool_Exp = {
  count?: InputMaybe<Notification_Permissions_Aggregate_Bool_Exp_Count>;
};

export type Notification_Permissions_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Notification_Permissions_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]["input"]>;
  filter?: InputMaybe<Notification_Permissions_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "notification_permissions" */
export type Notification_Permissions_Aggregate_Fields = {
  __typename?: "notification_permissions_aggregate_fields";
  count: Scalars["Int"]["output"];
  max?: Maybe<Notification_Permissions_Max_Fields>;
  min?: Maybe<Notification_Permissions_Min_Fields>;
};

/** aggregate fields of "notification_permissions" */
export type Notification_Permissions_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Notification_Permissions_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]["input"]>;
};

/** order by aggregate values of table "notification_permissions" */
export type Notification_Permissions_Aggregate_Order_By = {
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Notification_Permissions_Max_Order_By>;
  min?: InputMaybe<Notification_Permissions_Min_Order_By>;
};

/** append existing jsonb value of filtered columns with new jsonb value */
export type Notification_Permissions_Append_Input = {
  device_info?: InputMaybe<Scalars["jsonb"]["input"]>;
};

/** input type for inserting array relation for remote table "notification_permissions" */
export type Notification_Permissions_Arr_Rel_Insert_Input = {
  data: Array<Notification_Permissions_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<Notification_Permissions_On_Conflict>;
};

/** Boolean expression to filter rows from the table "notification_permissions". All fields are combined with a logical 'AND'. */
export type Notification_Permissions_Bool_Exp = {
  _and?: InputMaybe<Array<Notification_Permissions_Bool_Exp>>;
  _not?: InputMaybe<Notification_Permissions_Bool_Exp>;
  _or?: InputMaybe<Array<Notification_Permissions_Bool_Exp>>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  device_info?: InputMaybe<Jsonb_Comparison_Exp>;
  device_token?: InputMaybe<String_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  notifications?: InputMaybe<Notifications_Bool_Exp>;
  notifications_aggregate?: InputMaybe<Notifications_Aggregate_Bool_Exp>;
  provider?: InputMaybe<String_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  user?: InputMaybe<Users_Bool_Exp>;
  user_id?: InputMaybe<Uuid_Comparison_Exp>;
};

/** unique or primary key constraints on table "notification_permissions" */
export enum Notification_Permissions_Constraint {
  /** unique or primary key constraint on columns "id" */
  NotificationPermissionsPkey = "notification_permissions_pkey",
}

/** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
export type Notification_Permissions_Delete_At_Path_Input = {
  device_info?: InputMaybe<Array<Scalars["String"]["input"]>>;
};

/** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
export type Notification_Permissions_Delete_Elem_Input = {
  device_info?: InputMaybe<Scalars["Int"]["input"]>;
};

/** delete key/value pair or string element. key/value pairs are matched based on their key value */
export type Notification_Permissions_Delete_Key_Input = {
  device_info?: InputMaybe<Scalars["String"]["input"]>;
};

/** input type for inserting data into table "notification_permissions" */
export type Notification_Permissions_Insert_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  device_info?: InputMaybe<Scalars["jsonb"]["input"]>;
  device_token?: InputMaybe<Scalars["String"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  notifications?: InputMaybe<Notifications_Arr_Rel_Insert_Input>;
  provider?: InputMaybe<Scalars["String"]["input"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  user?: InputMaybe<Users_Obj_Rel_Insert_Input>;
  user_id?: InputMaybe<Scalars["uuid"]["input"]>;
};

/** aggregate max on columns */
export type Notification_Permissions_Max_Fields = {
  __typename?: "notification_permissions_max_fields";
  created_at?: Maybe<Scalars["timestamptz"]["output"]>;
  device_token?: Maybe<Scalars["String"]["output"]>;
  id?: Maybe<Scalars["uuid"]["output"]>;
  provider?: Maybe<Scalars["String"]["output"]>;
  updated_at?: Maybe<Scalars["timestamptz"]["output"]>;
  user_id?: Maybe<Scalars["uuid"]["output"]>;
};

/** order by max() on columns of table "notification_permissions" */
export type Notification_Permissions_Max_Order_By = {
  created_at?: InputMaybe<Order_By>;
  device_token?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  provider?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Notification_Permissions_Min_Fields = {
  __typename?: "notification_permissions_min_fields";
  created_at?: Maybe<Scalars["timestamptz"]["output"]>;
  device_token?: Maybe<Scalars["String"]["output"]>;
  id?: Maybe<Scalars["uuid"]["output"]>;
  provider?: Maybe<Scalars["String"]["output"]>;
  updated_at?: Maybe<Scalars["timestamptz"]["output"]>;
  user_id?: Maybe<Scalars["uuid"]["output"]>;
};

/** order by min() on columns of table "notification_permissions" */
export type Notification_Permissions_Min_Order_By = {
  created_at?: InputMaybe<Order_By>;
  device_token?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  provider?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "notification_permissions" */
export type Notification_Permissions_Mutation_Response = {
  __typename?: "notification_permissions_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"]["output"];
  /** data from the rows affected by the mutation */
  returning: Array<Notification_Permissions>;
};

/** input type for inserting object relation for remote table "notification_permissions" */
export type Notification_Permissions_Obj_Rel_Insert_Input = {
  data: Notification_Permissions_Insert_Input;
  /** upsert condition */
  on_conflict?: InputMaybe<Notification_Permissions_On_Conflict>;
};

/** on_conflict condition type for table "notification_permissions" */
export type Notification_Permissions_On_Conflict = {
  constraint: Notification_Permissions_Constraint;
  update_columns?: Array<Notification_Permissions_Update_Column>;
  where?: InputMaybe<Notification_Permissions_Bool_Exp>;
};

/** Ordering options when selecting data from "notification_permissions". */
export type Notification_Permissions_Order_By = {
  created_at?: InputMaybe<Order_By>;
  device_info?: InputMaybe<Order_By>;
  device_token?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  notifications_aggregate?: InputMaybe<Notifications_Aggregate_Order_By>;
  provider?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  user?: InputMaybe<Users_Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** primary key columns input for table: notification_permissions */
export type Notification_Permissions_Pk_Columns_Input = {
  id: Scalars["uuid"]["input"];
};

/** prepend existing jsonb value of filtered columns with new jsonb value */
export type Notification_Permissions_Prepend_Input = {
  device_info?: InputMaybe<Scalars["jsonb"]["input"]>;
};

/** select columns of table "notification_permissions" */
export enum Notification_Permissions_Select_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  DeviceInfo = "device_info",
  /** column name */
  DeviceToken = "device_token",
  /** column name */
  Id = "id",
  /** column name */
  Provider = "provider",
  /** column name */
  UpdatedAt = "updated_at",
  /** column name */
  UserId = "user_id",
}

/** input type for updating data in table "notification_permissions" */
export type Notification_Permissions_Set_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  device_info?: InputMaybe<Scalars["jsonb"]["input"]>;
  device_token?: InputMaybe<Scalars["String"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  provider?: InputMaybe<Scalars["String"]["input"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  user_id?: InputMaybe<Scalars["uuid"]["input"]>;
};

/** Streaming cursor of the table "notification_permissions" */
export type Notification_Permissions_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Notification_Permissions_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Notification_Permissions_Stream_Cursor_Value_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  device_info?: InputMaybe<Scalars["jsonb"]["input"]>;
  device_token?: InputMaybe<Scalars["String"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  provider?: InputMaybe<Scalars["String"]["input"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  user_id?: InputMaybe<Scalars["uuid"]["input"]>;
};

/** update columns of table "notification_permissions" */
export enum Notification_Permissions_Update_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  DeviceInfo = "device_info",
  /** column name */
  DeviceToken = "device_token",
  /** column name */
  Id = "id",
  /** column name */
  Provider = "provider",
  /** column name */
  UpdatedAt = "updated_at",
  /** column name */
  UserId = "user_id",
}

export type Notification_Permissions_Updates = {
  /** append existing jsonb value of filtered columns with new jsonb value */
  _append?: InputMaybe<Notification_Permissions_Append_Input>;
  /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
  _delete_at_path?: InputMaybe<Notification_Permissions_Delete_At_Path_Input>;
  /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
  _delete_elem?: InputMaybe<Notification_Permissions_Delete_Elem_Input>;
  /** delete key/value pair or string element. key/value pairs are matched based on their key value */
  _delete_key?: InputMaybe<Notification_Permissions_Delete_Key_Input>;
  /** prepend existing jsonb value of filtered columns with new jsonb value */
  _prepend?: InputMaybe<Notification_Permissions_Prepend_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Notification_Permissions_Set_Input>;
  /** filter the rows which have to be updated */
  where: Notification_Permissions_Bool_Exp;
};

/** columns and relationships of "notifications" */
export type Notifications = {
  __typename?: "notifications";
  config?: Maybe<Scalars["jsonb"]["output"]>;
  created_at: Scalars["timestamptz"]["output"];
  error?: Maybe<Scalars["String"]["output"]>;
  id: Scalars["uuid"]["output"];
  /** An object relationship */
  message: Notification_Messages;
  message_id: Scalars["uuid"]["output"];
  /** An object relationship */
  permission: Notification_Permissions;
  permission_id: Scalars["uuid"]["output"];
  status: Scalars["String"]["output"];
  updated_at: Scalars["timestamptz"]["output"];
};

/** columns and relationships of "notifications" */
export type NotificationsConfigArgs = {
  path?: InputMaybe<Scalars["String"]["input"]>;
};

/** aggregated selection of "notifications" */
export type Notifications_Aggregate = {
  __typename?: "notifications_aggregate";
  aggregate?: Maybe<Notifications_Aggregate_Fields>;
  nodes: Array<Notifications>;
};

export type Notifications_Aggregate_Bool_Exp = {
  count?: InputMaybe<Notifications_Aggregate_Bool_Exp_Count>;
};

export type Notifications_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Notifications_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]["input"]>;
  filter?: InputMaybe<Notifications_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "notifications" */
export type Notifications_Aggregate_Fields = {
  __typename?: "notifications_aggregate_fields";
  count: Scalars["Int"]["output"];
  max?: Maybe<Notifications_Max_Fields>;
  min?: Maybe<Notifications_Min_Fields>;
};

/** aggregate fields of "notifications" */
export type Notifications_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Notifications_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]["input"]>;
};

/** order by aggregate values of table "notifications" */
export type Notifications_Aggregate_Order_By = {
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Notifications_Max_Order_By>;
  min?: InputMaybe<Notifications_Min_Order_By>;
};

/** append existing jsonb value of filtered columns with new jsonb value */
export type Notifications_Append_Input = {
  config?: InputMaybe<Scalars["jsonb"]["input"]>;
};

/** input type for inserting array relation for remote table "notifications" */
export type Notifications_Arr_Rel_Insert_Input = {
  data: Array<Notifications_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<Notifications_On_Conflict>;
};

/** Boolean expression to filter rows from the table "notifications". All fields are combined with a logical 'AND'. */
export type Notifications_Bool_Exp = {
  _and?: InputMaybe<Array<Notifications_Bool_Exp>>;
  _not?: InputMaybe<Notifications_Bool_Exp>;
  _or?: InputMaybe<Array<Notifications_Bool_Exp>>;
  config?: InputMaybe<Jsonb_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  error?: InputMaybe<String_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  message?: InputMaybe<Notification_Messages_Bool_Exp>;
  message_id?: InputMaybe<Uuid_Comparison_Exp>;
  permission?: InputMaybe<Notification_Permissions_Bool_Exp>;
  permission_id?: InputMaybe<Uuid_Comparison_Exp>;
  status?: InputMaybe<String_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "notifications" */
export enum Notifications_Constraint {
  /** unique or primary key constraint on columns "id" */
  NotificationsPkey = "notifications_pkey",
}

/** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
export type Notifications_Delete_At_Path_Input = {
  config?: InputMaybe<Array<Scalars["String"]["input"]>>;
};

/** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
export type Notifications_Delete_Elem_Input = {
  config?: InputMaybe<Scalars["Int"]["input"]>;
};

/** delete key/value pair or string element. key/value pairs are matched based on their key value */
export type Notifications_Delete_Key_Input = {
  config?: InputMaybe<Scalars["String"]["input"]>;
};

/** input type for inserting data into table "notifications" */
export type Notifications_Insert_Input = {
  config?: InputMaybe<Scalars["jsonb"]["input"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  error?: InputMaybe<Scalars["String"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  message?: InputMaybe<Notification_Messages_Obj_Rel_Insert_Input>;
  message_id?: InputMaybe<Scalars["uuid"]["input"]>;
  permission?: InputMaybe<Notification_Permissions_Obj_Rel_Insert_Input>;
  permission_id?: InputMaybe<Scalars["uuid"]["input"]>;
  status?: InputMaybe<Scalars["String"]["input"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
};

/** aggregate max on columns */
export type Notifications_Max_Fields = {
  __typename?: "notifications_max_fields";
  created_at?: Maybe<Scalars["timestamptz"]["output"]>;
  error?: Maybe<Scalars["String"]["output"]>;
  id?: Maybe<Scalars["uuid"]["output"]>;
  message_id?: Maybe<Scalars["uuid"]["output"]>;
  permission_id?: Maybe<Scalars["uuid"]["output"]>;
  status?: Maybe<Scalars["String"]["output"]>;
  updated_at?: Maybe<Scalars["timestamptz"]["output"]>;
};

/** order by max() on columns of table "notifications" */
export type Notifications_Max_Order_By = {
  created_at?: InputMaybe<Order_By>;
  error?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  message_id?: InputMaybe<Order_By>;
  permission_id?: InputMaybe<Order_By>;
  status?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Notifications_Min_Fields = {
  __typename?: "notifications_min_fields";
  created_at?: Maybe<Scalars["timestamptz"]["output"]>;
  error?: Maybe<Scalars["String"]["output"]>;
  id?: Maybe<Scalars["uuid"]["output"]>;
  message_id?: Maybe<Scalars["uuid"]["output"]>;
  permission_id?: Maybe<Scalars["uuid"]["output"]>;
  status?: Maybe<Scalars["String"]["output"]>;
  updated_at?: Maybe<Scalars["timestamptz"]["output"]>;
};

/** order by min() on columns of table "notifications" */
export type Notifications_Min_Order_By = {
  created_at?: InputMaybe<Order_By>;
  error?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  message_id?: InputMaybe<Order_By>;
  permission_id?: InputMaybe<Order_By>;
  status?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "notifications" */
export type Notifications_Mutation_Response = {
  __typename?: "notifications_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"]["output"];
  /** data from the rows affected by the mutation */
  returning: Array<Notifications>;
};

/** on_conflict condition type for table "notifications" */
export type Notifications_On_Conflict = {
  constraint: Notifications_Constraint;
  update_columns?: Array<Notifications_Update_Column>;
  where?: InputMaybe<Notifications_Bool_Exp>;
};

/** Ordering options when selecting data from "notifications". */
export type Notifications_Order_By = {
  config?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  error?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  message?: InputMaybe<Notification_Messages_Order_By>;
  message_id?: InputMaybe<Order_By>;
  permission?: InputMaybe<Notification_Permissions_Order_By>;
  permission_id?: InputMaybe<Order_By>;
  status?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** primary key columns input for table: notifications */
export type Notifications_Pk_Columns_Input = {
  id: Scalars["uuid"]["input"];
};

/** prepend existing jsonb value of filtered columns with new jsonb value */
export type Notifications_Prepend_Input = {
  config?: InputMaybe<Scalars["jsonb"]["input"]>;
};

/** select columns of table "notifications" */
export enum Notifications_Select_Column {
  /** column name */
  Config = "config",
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Error = "error",
  /** column name */
  Id = "id",
  /** column name */
  MessageId = "message_id",
  /** column name */
  PermissionId = "permission_id",
  /** column name */
  Status = "status",
  /** column name */
  UpdatedAt = "updated_at",
}

/** input type for updating data in table "notifications" */
export type Notifications_Set_Input = {
  config?: InputMaybe<Scalars["jsonb"]["input"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  error?: InputMaybe<Scalars["String"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  message_id?: InputMaybe<Scalars["uuid"]["input"]>;
  permission_id?: InputMaybe<Scalars["uuid"]["input"]>;
  status?: InputMaybe<Scalars["String"]["input"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
};

/** Streaming cursor of the table "notifications" */
export type Notifications_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Notifications_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Notifications_Stream_Cursor_Value_Input = {
  config?: InputMaybe<Scalars["jsonb"]["input"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  error?: InputMaybe<Scalars["String"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  message_id?: InputMaybe<Scalars["uuid"]["input"]>;
  permission_id?: InputMaybe<Scalars["uuid"]["input"]>;
  status?: InputMaybe<Scalars["String"]["input"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
};

/** update columns of table "notifications" */
export enum Notifications_Update_Column {
  /** column name */
  Config = "config",
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Error = "error",
  /** column name */
  Id = "id",
  /** column name */
  MessageId = "message_id",
  /** column name */
  PermissionId = "permission_id",
  /** column name */
  Status = "status",
  /** column name */
  UpdatedAt = "updated_at",
}

export type Notifications_Updates = {
  /** append existing jsonb value of filtered columns with new jsonb value */
  _append?: InputMaybe<Notifications_Append_Input>;
  /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
  _delete_at_path?: InputMaybe<Notifications_Delete_At_Path_Input>;
  /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
  _delete_elem?: InputMaybe<Notifications_Delete_Elem_Input>;
  /** delete key/value pair or string element. key/value pairs are matched based on their key value */
  _delete_key?: InputMaybe<Notifications_Delete_Key_Input>;
  /** prepend existing jsonb value of filtered columns with new jsonb value */
  _prepend?: InputMaybe<Notifications_Prepend_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Notifications_Set_Input>;
  /** filter the rows which have to be updated */
  where: Notifications_Bool_Exp;
};

/** Boolean expression to compare columns of type "numeric". All fields are combined with logical 'AND'. */
export type Numeric_Comparison_Exp = {
  _eq?: InputMaybe<Scalars["numeric"]["input"]>;
  _gt?: InputMaybe<Scalars["numeric"]["input"]>;
  _gte?: InputMaybe<Scalars["numeric"]["input"]>;
  _in?: InputMaybe<Array<Scalars["numeric"]["input"]>>;
  _is_null?: InputMaybe<Scalars["Boolean"]["input"]>;
  _lt?: InputMaybe<Scalars["numeric"]["input"]>;
  _lte?: InputMaybe<Scalars["numeric"]["input"]>;
  _neq?: InputMaybe<Scalars["numeric"]["input"]>;
  _nin?: InputMaybe<Array<Scalars["numeric"]["input"]>>;
};

/** column ordering options */
export enum Order_By {
  /** in ascending order, nulls last */
  Asc = "asc",
  /** in ascending order, nulls first */
  AscNullsFirst = "asc_nulls_first",
  /** in ascending order, nulls last */
  AscNullsLast = "asc_nulls_last",
  /** in descending order, nulls first */
  Desc = "desc",
  /** in descending order, nulls first */
  DescNullsFirst = "desc_nulls_first",
  /** in descending order, nulls last */
  DescNullsLast = "desc_nulls_last",
}

export type Query_Root = {
  __typename?: "query_root";
  /** An array relationship */
  accounts: Array<Accounts>;
  /** An aggregate relationship */
  accounts_aggregate: Accounts_Aggregate;
  /** fetch data from the table: "accounts" using primary key columns */
  accounts_by_pk?: Maybe<Accounts>;
  /** fetch data from the table: "badma.ais" */
  badma_ais: Array<Badma_Ais>;
  /** fetch aggregated fields from the table: "badma.ais" */
  badma_ais_aggregate: Badma_Ais_Aggregate;
  /** fetch data from the table: "badma.ais" using primary key columns */
  badma_ais_by_pk?: Maybe<Badma_Ais>;
  /** fetch data from the table: "badma.errors" */
  badma_errors: Array<Badma_Errors>;
  /** fetch aggregated fields from the table: "badma.errors" */
  badma_errors_aggregate: Badma_Errors_Aggregate;
  /** fetch data from the table: "badma.errors" using primary key columns */
  badma_errors_by_pk?: Maybe<Badma_Errors>;
  /** fetch data from the table: "badma.games" */
  badma_games: Array<Badma_Games>;
  /** fetch aggregated fields from the table: "badma.games" */
  badma_games_aggregate: Badma_Games_Aggregate;
  /** fetch data from the table: "badma.games" using primary key columns */
  badma_games_by_pk?: Maybe<Badma_Games>;
  /** fetch data from the table: "badma.joins" */
  badma_joins: Array<Badma_Joins>;
  /** fetch aggregated fields from the table: "badma.joins" */
  badma_joins_aggregate: Badma_Joins_Aggregate;
  /** fetch data from the table: "badma.joins" using primary key columns */
  badma_joins_by_pk?: Maybe<Badma_Joins>;
  /** fetch data from the table: "badma.moves" */
  badma_moves: Array<Badma_Moves>;
  /** fetch aggregated fields from the table: "badma.moves" */
  badma_moves_aggregate: Badma_Moves_Aggregate;
  /** fetch data from the table: "badma.moves" using primary key columns */
  badma_moves_by_pk?: Maybe<Badma_Moves>;
  /** fetch data from the table: "badma.servers" */
  badma_servers: Array<Badma_Servers>;
  /** fetch aggregated fields from the table: "badma.servers" */
  badma_servers_aggregate: Badma_Servers_Aggregate;
  /** fetch data from the table: "badma.servers" using primary key columns */
  badma_servers_by_pk?: Maybe<Badma_Servers>;
  /** fetch data from the table: "badma.tournament_games" */
  badma_tournament_games: Array<Badma_Tournament_Games>;
  /** fetch aggregated fields from the table: "badma.tournament_games" */
  badma_tournament_games_aggregate: Badma_Tournament_Games_Aggregate;
  /** fetch data from the table: "badma.tournament_games" using primary key columns */
  badma_tournament_games_by_pk?: Maybe<Badma_Tournament_Games>;
  /** fetch data from the table: "badma.tournament_participants" */
  badma_tournament_participants: Array<Badma_Tournament_Participants>;
  /** fetch aggregated fields from the table: "badma.tournament_participants" */
  badma_tournament_participants_aggregate: Badma_Tournament_Participants_Aggregate;
  /** fetch data from the table: "badma.tournament_participants" using primary key columns */
  badma_tournament_participants_by_pk?: Maybe<Badma_Tournament_Participants>;
  /** fetch data from the table: "badma.tournament_scores" */
  badma_tournament_scores: Array<Badma_Tournament_Scores>;
  /** fetch aggregated fields from the table: "badma.tournament_scores" */
  badma_tournament_scores_aggregate: Badma_Tournament_Scores_Aggregate;
  /** fetch data from the table: "badma.tournament_scores" using primary key columns */
  badma_tournament_scores_by_pk?: Maybe<Badma_Tournament_Scores>;
  /** fetch data from the table: "badma.tournaments" */
  badma_tournaments: Array<Badma_Tournaments>;
  /** fetch aggregated fields from the table: "badma.tournaments" */
  badma_tournaments_aggregate: Badma_Tournaments_Aggregate;
  /** fetch data from the table: "badma.tournaments" using primary key columns */
  badma_tournaments_by_pk?: Maybe<Badma_Tournaments>;
  /** fetch data from the table: "debug" */
  debug: Array<Debug>;
  /** fetch aggregated fields from the table: "debug" */
  debug_aggregate: Debug_Aggregate;
  /** fetch data from the table: "debug" using primary key columns */
  debug_by_pk?: Maybe<Debug>;
  /** An array relationship */
  notification_messages: Array<Notification_Messages>;
  /** An aggregate relationship */
  notification_messages_aggregate: Notification_Messages_Aggregate;
  /** fetch data from the table: "notification_messages" using primary key columns */
  notification_messages_by_pk?: Maybe<Notification_Messages>;
  /** An array relationship */
  notification_permissions: Array<Notification_Permissions>;
  /** An aggregate relationship */
  notification_permissions_aggregate: Notification_Permissions_Aggregate;
  /** fetch data from the table: "notification_permissions" using primary key columns */
  notification_permissions_by_pk?: Maybe<Notification_Permissions>;
  /** An array relationship */
  notifications: Array<Notifications>;
  /** An aggregate relationship */
  notifications_aggregate: Notifications_Aggregate;
  /** fetch data from the table: "notifications" using primary key columns */
  notifications_by_pk?: Maybe<Notifications>;
  /** fetch data from the table: "users" */
  users: Array<Users>;
  /** fetch aggregated fields from the table: "users" */
  users_aggregate: Users_Aggregate;
  /** fetch data from the table: "users" using primary key columns */
  users_by_pk?: Maybe<Users>;
};

export type Query_RootAccountsArgs = {
  distinct_on?: InputMaybe<Array<Accounts_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Accounts_Order_By>>;
  where?: InputMaybe<Accounts_Bool_Exp>;
};

export type Query_RootAccounts_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Accounts_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Accounts_Order_By>>;
  where?: InputMaybe<Accounts_Bool_Exp>;
};

export type Query_RootAccounts_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

export type Query_RootBadma_AisArgs = {
  distinct_on?: InputMaybe<Array<Badma_Ais_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Ais_Order_By>>;
  where?: InputMaybe<Badma_Ais_Bool_Exp>;
};

export type Query_RootBadma_Ais_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Badma_Ais_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Ais_Order_By>>;
  where?: InputMaybe<Badma_Ais_Bool_Exp>;
};

export type Query_RootBadma_Ais_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

export type Query_RootBadma_ErrorsArgs = {
  distinct_on?: InputMaybe<Array<Badma_Errors_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Errors_Order_By>>;
  where?: InputMaybe<Badma_Errors_Bool_Exp>;
};

export type Query_RootBadma_Errors_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Badma_Errors_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Errors_Order_By>>;
  where?: InputMaybe<Badma_Errors_Bool_Exp>;
};

export type Query_RootBadma_Errors_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

export type Query_RootBadma_GamesArgs = {
  distinct_on?: InputMaybe<Array<Badma_Games_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Games_Order_By>>;
  where?: InputMaybe<Badma_Games_Bool_Exp>;
};

export type Query_RootBadma_Games_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Badma_Games_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Games_Order_By>>;
  where?: InputMaybe<Badma_Games_Bool_Exp>;
};

export type Query_RootBadma_Games_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

export type Query_RootBadma_JoinsArgs = {
  distinct_on?: InputMaybe<Array<Badma_Joins_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Joins_Order_By>>;
  where?: InputMaybe<Badma_Joins_Bool_Exp>;
};

export type Query_RootBadma_Joins_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Badma_Joins_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Joins_Order_By>>;
  where?: InputMaybe<Badma_Joins_Bool_Exp>;
};

export type Query_RootBadma_Joins_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

export type Query_RootBadma_MovesArgs = {
  distinct_on?: InputMaybe<Array<Badma_Moves_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Moves_Order_By>>;
  where?: InputMaybe<Badma_Moves_Bool_Exp>;
};

export type Query_RootBadma_Moves_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Badma_Moves_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Moves_Order_By>>;
  where?: InputMaybe<Badma_Moves_Bool_Exp>;
};

export type Query_RootBadma_Moves_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

export type Query_RootBadma_ServersArgs = {
  distinct_on?: InputMaybe<Array<Badma_Servers_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Servers_Order_By>>;
  where?: InputMaybe<Badma_Servers_Bool_Exp>;
};

export type Query_RootBadma_Servers_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Badma_Servers_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Servers_Order_By>>;
  where?: InputMaybe<Badma_Servers_Bool_Exp>;
};

export type Query_RootBadma_Servers_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

export type Query_RootBadma_Tournament_GamesArgs = {
  distinct_on?: InputMaybe<Array<Badma_Tournament_Games_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Tournament_Games_Order_By>>;
  where?: InputMaybe<Badma_Tournament_Games_Bool_Exp>;
};

export type Query_RootBadma_Tournament_Games_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Badma_Tournament_Games_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Tournament_Games_Order_By>>;
  where?: InputMaybe<Badma_Tournament_Games_Bool_Exp>;
};

export type Query_RootBadma_Tournament_Games_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

export type Query_RootBadma_Tournament_ParticipantsArgs = {
  distinct_on?: InputMaybe<Array<Badma_Tournament_Participants_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Tournament_Participants_Order_By>>;
  where?: InputMaybe<Badma_Tournament_Participants_Bool_Exp>;
};

export type Query_RootBadma_Tournament_Participants_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Badma_Tournament_Participants_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Tournament_Participants_Order_By>>;
  where?: InputMaybe<Badma_Tournament_Participants_Bool_Exp>;
};

export type Query_RootBadma_Tournament_Participants_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

export type Query_RootBadma_Tournament_ScoresArgs = {
  distinct_on?: InputMaybe<Array<Badma_Tournament_Scores_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Tournament_Scores_Order_By>>;
  where?: InputMaybe<Badma_Tournament_Scores_Bool_Exp>;
};

export type Query_RootBadma_Tournament_Scores_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Badma_Tournament_Scores_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Tournament_Scores_Order_By>>;
  where?: InputMaybe<Badma_Tournament_Scores_Bool_Exp>;
};

export type Query_RootBadma_Tournament_Scores_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

export type Query_RootBadma_TournamentsArgs = {
  distinct_on?: InputMaybe<Array<Badma_Tournaments_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Tournaments_Order_By>>;
  where?: InputMaybe<Badma_Tournaments_Bool_Exp>;
};

export type Query_RootBadma_Tournaments_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Badma_Tournaments_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Tournaments_Order_By>>;
  where?: InputMaybe<Badma_Tournaments_Bool_Exp>;
};

export type Query_RootBadma_Tournaments_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

export type Query_RootDebugArgs = {
  distinct_on?: InputMaybe<Array<Debug_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Debug_Order_By>>;
  where?: InputMaybe<Debug_Bool_Exp>;
};

export type Query_RootDebug_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Debug_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Debug_Order_By>>;
  where?: InputMaybe<Debug_Bool_Exp>;
};

export type Query_RootDebug_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

export type Query_RootNotification_MessagesArgs = {
  distinct_on?: InputMaybe<Array<Notification_Messages_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Notification_Messages_Order_By>>;
  where?: InputMaybe<Notification_Messages_Bool_Exp>;
};

export type Query_RootNotification_Messages_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Notification_Messages_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Notification_Messages_Order_By>>;
  where?: InputMaybe<Notification_Messages_Bool_Exp>;
};

export type Query_RootNotification_Messages_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

export type Query_RootNotification_PermissionsArgs = {
  distinct_on?: InputMaybe<Array<Notification_Permissions_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Notification_Permissions_Order_By>>;
  where?: InputMaybe<Notification_Permissions_Bool_Exp>;
};

export type Query_RootNotification_Permissions_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Notification_Permissions_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Notification_Permissions_Order_By>>;
  where?: InputMaybe<Notification_Permissions_Bool_Exp>;
};

export type Query_RootNotification_Permissions_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

export type Query_RootNotificationsArgs = {
  distinct_on?: InputMaybe<Array<Notifications_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Notifications_Order_By>>;
  where?: InputMaybe<Notifications_Bool_Exp>;
};

export type Query_RootNotifications_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Notifications_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Notifications_Order_By>>;
  where?: InputMaybe<Notifications_Bool_Exp>;
};

export type Query_RootNotifications_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

export type Query_RootUsersArgs = {
  distinct_on?: InputMaybe<Array<Users_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Users_Order_By>>;
  where?: InputMaybe<Users_Bool_Exp>;
};

export type Query_RootUsers_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Users_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Users_Order_By>>;
  where?: InputMaybe<Users_Bool_Exp>;
};

export type Query_RootUsers_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

export type Subscription_Root = {
  __typename?: "subscription_root";
  /** An array relationship */
  accounts: Array<Accounts>;
  /** An aggregate relationship */
  accounts_aggregate: Accounts_Aggregate;
  /** fetch data from the table: "accounts" using primary key columns */
  accounts_by_pk?: Maybe<Accounts>;
  /** fetch data from the table in a streaming manner: "accounts" */
  accounts_stream: Array<Accounts>;
  /** fetch data from the table: "badma.ais" */
  badma_ais: Array<Badma_Ais>;
  /** fetch aggregated fields from the table: "badma.ais" */
  badma_ais_aggregate: Badma_Ais_Aggregate;
  /** fetch data from the table: "badma.ais" using primary key columns */
  badma_ais_by_pk?: Maybe<Badma_Ais>;
  /** fetch data from the table in a streaming manner: "badma.ais" */
  badma_ais_stream: Array<Badma_Ais>;
  /** fetch data from the table: "badma.errors" */
  badma_errors: Array<Badma_Errors>;
  /** fetch aggregated fields from the table: "badma.errors" */
  badma_errors_aggregate: Badma_Errors_Aggregate;
  /** fetch data from the table: "badma.errors" using primary key columns */
  badma_errors_by_pk?: Maybe<Badma_Errors>;
  /** fetch data from the table in a streaming manner: "badma.errors" */
  badma_errors_stream: Array<Badma_Errors>;
  /** fetch data from the table: "badma.games" */
  badma_games: Array<Badma_Games>;
  /** fetch aggregated fields from the table: "badma.games" */
  badma_games_aggregate: Badma_Games_Aggregate;
  /** fetch data from the table: "badma.games" using primary key columns */
  badma_games_by_pk?: Maybe<Badma_Games>;
  /** fetch data from the table in a streaming manner: "badma.games" */
  badma_games_stream: Array<Badma_Games>;
  /** fetch data from the table: "badma.joins" */
  badma_joins: Array<Badma_Joins>;
  /** fetch aggregated fields from the table: "badma.joins" */
  badma_joins_aggregate: Badma_Joins_Aggregate;
  /** fetch data from the table: "badma.joins" using primary key columns */
  badma_joins_by_pk?: Maybe<Badma_Joins>;
  /** fetch data from the table in a streaming manner: "badma.joins" */
  badma_joins_stream: Array<Badma_Joins>;
  /** fetch data from the table: "badma.moves" */
  badma_moves: Array<Badma_Moves>;
  /** fetch aggregated fields from the table: "badma.moves" */
  badma_moves_aggregate: Badma_Moves_Aggregate;
  /** fetch data from the table: "badma.moves" using primary key columns */
  badma_moves_by_pk?: Maybe<Badma_Moves>;
  /** fetch data from the table in a streaming manner: "badma.moves" */
  badma_moves_stream: Array<Badma_Moves>;
  /** fetch data from the table: "badma.servers" */
  badma_servers: Array<Badma_Servers>;
  /** fetch aggregated fields from the table: "badma.servers" */
  badma_servers_aggregate: Badma_Servers_Aggregate;
  /** fetch data from the table: "badma.servers" using primary key columns */
  badma_servers_by_pk?: Maybe<Badma_Servers>;
  /** fetch data from the table in a streaming manner: "badma.servers" */
  badma_servers_stream: Array<Badma_Servers>;
  /** fetch data from the table: "badma.tournament_games" */
  badma_tournament_games: Array<Badma_Tournament_Games>;
  /** fetch aggregated fields from the table: "badma.tournament_games" */
  badma_tournament_games_aggregate: Badma_Tournament_Games_Aggregate;
  /** fetch data from the table: "badma.tournament_games" using primary key columns */
  badma_tournament_games_by_pk?: Maybe<Badma_Tournament_Games>;
  /** fetch data from the table in a streaming manner: "badma.tournament_games" */
  badma_tournament_games_stream: Array<Badma_Tournament_Games>;
  /** fetch data from the table: "badma.tournament_participants" */
  badma_tournament_participants: Array<Badma_Tournament_Participants>;
  /** fetch aggregated fields from the table: "badma.tournament_participants" */
  badma_tournament_participants_aggregate: Badma_Tournament_Participants_Aggregate;
  /** fetch data from the table: "badma.tournament_participants" using primary key columns */
  badma_tournament_participants_by_pk?: Maybe<Badma_Tournament_Participants>;
  /** fetch data from the table in a streaming manner: "badma.tournament_participants" */
  badma_tournament_participants_stream: Array<Badma_Tournament_Participants>;
  /** fetch data from the table: "badma.tournament_scores" */
  badma_tournament_scores: Array<Badma_Tournament_Scores>;
  /** fetch aggregated fields from the table: "badma.tournament_scores" */
  badma_tournament_scores_aggregate: Badma_Tournament_Scores_Aggregate;
  /** fetch data from the table: "badma.tournament_scores" using primary key columns */
  badma_tournament_scores_by_pk?: Maybe<Badma_Tournament_Scores>;
  /** fetch data from the table in a streaming manner: "badma.tournament_scores" */
  badma_tournament_scores_stream: Array<Badma_Tournament_Scores>;
  /** fetch data from the table: "badma.tournaments" */
  badma_tournaments: Array<Badma_Tournaments>;
  /** fetch aggregated fields from the table: "badma.tournaments" */
  badma_tournaments_aggregate: Badma_Tournaments_Aggregate;
  /** fetch data from the table: "badma.tournaments" using primary key columns */
  badma_tournaments_by_pk?: Maybe<Badma_Tournaments>;
  /** fetch data from the table in a streaming manner: "badma.tournaments" */
  badma_tournaments_stream: Array<Badma_Tournaments>;
  /** fetch data from the table: "debug" */
  debug: Array<Debug>;
  /** fetch aggregated fields from the table: "debug" */
  debug_aggregate: Debug_Aggregate;
  /** fetch data from the table: "debug" using primary key columns */
  debug_by_pk?: Maybe<Debug>;
  /** fetch data from the table in a streaming manner: "debug" */
  debug_stream: Array<Debug>;
  /** An array relationship */
  notification_messages: Array<Notification_Messages>;
  /** An aggregate relationship */
  notification_messages_aggregate: Notification_Messages_Aggregate;
  /** fetch data from the table: "notification_messages" using primary key columns */
  notification_messages_by_pk?: Maybe<Notification_Messages>;
  /** fetch data from the table in a streaming manner: "notification_messages" */
  notification_messages_stream: Array<Notification_Messages>;
  /** An array relationship */
  notification_permissions: Array<Notification_Permissions>;
  /** An aggregate relationship */
  notification_permissions_aggregate: Notification_Permissions_Aggregate;
  /** fetch data from the table: "notification_permissions" using primary key columns */
  notification_permissions_by_pk?: Maybe<Notification_Permissions>;
  /** fetch data from the table in a streaming manner: "notification_permissions" */
  notification_permissions_stream: Array<Notification_Permissions>;
  /** An array relationship */
  notifications: Array<Notifications>;
  /** An aggregate relationship */
  notifications_aggregate: Notifications_Aggregate;
  /** fetch data from the table: "notifications" using primary key columns */
  notifications_by_pk?: Maybe<Notifications>;
  /** fetch data from the table in a streaming manner: "notifications" */
  notifications_stream: Array<Notifications>;
  /** fetch data from the table: "users" */
  users: Array<Users>;
  /** fetch aggregated fields from the table: "users" */
  users_aggregate: Users_Aggregate;
  /** fetch data from the table: "users" using primary key columns */
  users_by_pk?: Maybe<Users>;
  /** fetch data from the table in a streaming manner: "users" */
  users_stream: Array<Users>;
};

export type Subscription_RootAccountsArgs = {
  distinct_on?: InputMaybe<Array<Accounts_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Accounts_Order_By>>;
  where?: InputMaybe<Accounts_Bool_Exp>;
};

export type Subscription_RootAccounts_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Accounts_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Accounts_Order_By>>;
  where?: InputMaybe<Accounts_Bool_Exp>;
};

export type Subscription_RootAccounts_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

export type Subscription_RootAccounts_StreamArgs = {
  batch_size: Scalars["Int"]["input"];
  cursor: Array<InputMaybe<Accounts_Stream_Cursor_Input>>;
  where?: InputMaybe<Accounts_Bool_Exp>;
};

export type Subscription_RootBadma_AisArgs = {
  distinct_on?: InputMaybe<Array<Badma_Ais_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Ais_Order_By>>;
  where?: InputMaybe<Badma_Ais_Bool_Exp>;
};

export type Subscription_RootBadma_Ais_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Badma_Ais_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Ais_Order_By>>;
  where?: InputMaybe<Badma_Ais_Bool_Exp>;
};

export type Subscription_RootBadma_Ais_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

export type Subscription_RootBadma_Ais_StreamArgs = {
  batch_size: Scalars["Int"]["input"];
  cursor: Array<InputMaybe<Badma_Ais_Stream_Cursor_Input>>;
  where?: InputMaybe<Badma_Ais_Bool_Exp>;
};

export type Subscription_RootBadma_ErrorsArgs = {
  distinct_on?: InputMaybe<Array<Badma_Errors_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Errors_Order_By>>;
  where?: InputMaybe<Badma_Errors_Bool_Exp>;
};

export type Subscription_RootBadma_Errors_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Badma_Errors_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Errors_Order_By>>;
  where?: InputMaybe<Badma_Errors_Bool_Exp>;
};

export type Subscription_RootBadma_Errors_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

export type Subscription_RootBadma_Errors_StreamArgs = {
  batch_size: Scalars["Int"]["input"];
  cursor: Array<InputMaybe<Badma_Errors_Stream_Cursor_Input>>;
  where?: InputMaybe<Badma_Errors_Bool_Exp>;
};

export type Subscription_RootBadma_GamesArgs = {
  distinct_on?: InputMaybe<Array<Badma_Games_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Games_Order_By>>;
  where?: InputMaybe<Badma_Games_Bool_Exp>;
};

export type Subscription_RootBadma_Games_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Badma_Games_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Games_Order_By>>;
  where?: InputMaybe<Badma_Games_Bool_Exp>;
};

export type Subscription_RootBadma_Games_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

export type Subscription_RootBadma_Games_StreamArgs = {
  batch_size: Scalars["Int"]["input"];
  cursor: Array<InputMaybe<Badma_Games_Stream_Cursor_Input>>;
  where?: InputMaybe<Badma_Games_Bool_Exp>;
};

export type Subscription_RootBadma_JoinsArgs = {
  distinct_on?: InputMaybe<Array<Badma_Joins_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Joins_Order_By>>;
  where?: InputMaybe<Badma_Joins_Bool_Exp>;
};

export type Subscription_RootBadma_Joins_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Badma_Joins_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Joins_Order_By>>;
  where?: InputMaybe<Badma_Joins_Bool_Exp>;
};

export type Subscription_RootBadma_Joins_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

export type Subscription_RootBadma_Joins_StreamArgs = {
  batch_size: Scalars["Int"]["input"];
  cursor: Array<InputMaybe<Badma_Joins_Stream_Cursor_Input>>;
  where?: InputMaybe<Badma_Joins_Bool_Exp>;
};

export type Subscription_RootBadma_MovesArgs = {
  distinct_on?: InputMaybe<Array<Badma_Moves_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Moves_Order_By>>;
  where?: InputMaybe<Badma_Moves_Bool_Exp>;
};

export type Subscription_RootBadma_Moves_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Badma_Moves_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Moves_Order_By>>;
  where?: InputMaybe<Badma_Moves_Bool_Exp>;
};

export type Subscription_RootBadma_Moves_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

export type Subscription_RootBadma_Moves_StreamArgs = {
  batch_size: Scalars["Int"]["input"];
  cursor: Array<InputMaybe<Badma_Moves_Stream_Cursor_Input>>;
  where?: InputMaybe<Badma_Moves_Bool_Exp>;
};

export type Subscription_RootBadma_ServersArgs = {
  distinct_on?: InputMaybe<Array<Badma_Servers_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Servers_Order_By>>;
  where?: InputMaybe<Badma_Servers_Bool_Exp>;
};

export type Subscription_RootBadma_Servers_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Badma_Servers_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Servers_Order_By>>;
  where?: InputMaybe<Badma_Servers_Bool_Exp>;
};

export type Subscription_RootBadma_Servers_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

export type Subscription_RootBadma_Servers_StreamArgs = {
  batch_size: Scalars["Int"]["input"];
  cursor: Array<InputMaybe<Badma_Servers_Stream_Cursor_Input>>;
  where?: InputMaybe<Badma_Servers_Bool_Exp>;
};

export type Subscription_RootBadma_Tournament_GamesArgs = {
  distinct_on?: InputMaybe<Array<Badma_Tournament_Games_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Tournament_Games_Order_By>>;
  where?: InputMaybe<Badma_Tournament_Games_Bool_Exp>;
};

export type Subscription_RootBadma_Tournament_Games_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Badma_Tournament_Games_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Tournament_Games_Order_By>>;
  where?: InputMaybe<Badma_Tournament_Games_Bool_Exp>;
};

export type Subscription_RootBadma_Tournament_Games_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

export type Subscription_RootBadma_Tournament_Games_StreamArgs = {
  batch_size: Scalars["Int"]["input"];
  cursor: Array<InputMaybe<Badma_Tournament_Games_Stream_Cursor_Input>>;
  where?: InputMaybe<Badma_Tournament_Games_Bool_Exp>;
};

export type Subscription_RootBadma_Tournament_ParticipantsArgs = {
  distinct_on?: InputMaybe<Array<Badma_Tournament_Participants_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Tournament_Participants_Order_By>>;
  where?: InputMaybe<Badma_Tournament_Participants_Bool_Exp>;
};

export type Subscription_RootBadma_Tournament_Participants_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Badma_Tournament_Participants_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Tournament_Participants_Order_By>>;
  where?: InputMaybe<Badma_Tournament_Participants_Bool_Exp>;
};

export type Subscription_RootBadma_Tournament_Participants_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

export type Subscription_RootBadma_Tournament_Participants_StreamArgs = {
  batch_size: Scalars["Int"]["input"];
  cursor: Array<InputMaybe<Badma_Tournament_Participants_Stream_Cursor_Input>>;
  where?: InputMaybe<Badma_Tournament_Participants_Bool_Exp>;
};

export type Subscription_RootBadma_Tournament_ScoresArgs = {
  distinct_on?: InputMaybe<Array<Badma_Tournament_Scores_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Tournament_Scores_Order_By>>;
  where?: InputMaybe<Badma_Tournament_Scores_Bool_Exp>;
};

export type Subscription_RootBadma_Tournament_Scores_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Badma_Tournament_Scores_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Tournament_Scores_Order_By>>;
  where?: InputMaybe<Badma_Tournament_Scores_Bool_Exp>;
};

export type Subscription_RootBadma_Tournament_Scores_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

export type Subscription_RootBadma_Tournament_Scores_StreamArgs = {
  batch_size: Scalars["Int"]["input"];
  cursor: Array<InputMaybe<Badma_Tournament_Scores_Stream_Cursor_Input>>;
  where?: InputMaybe<Badma_Tournament_Scores_Bool_Exp>;
};

export type Subscription_RootBadma_TournamentsArgs = {
  distinct_on?: InputMaybe<Array<Badma_Tournaments_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Tournaments_Order_By>>;
  where?: InputMaybe<Badma_Tournaments_Bool_Exp>;
};

export type Subscription_RootBadma_Tournaments_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Badma_Tournaments_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Tournaments_Order_By>>;
  where?: InputMaybe<Badma_Tournaments_Bool_Exp>;
};

export type Subscription_RootBadma_Tournaments_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

export type Subscription_RootBadma_Tournaments_StreamArgs = {
  batch_size: Scalars["Int"]["input"];
  cursor: Array<InputMaybe<Badma_Tournaments_Stream_Cursor_Input>>;
  where?: InputMaybe<Badma_Tournaments_Bool_Exp>;
};

export type Subscription_RootDebugArgs = {
  distinct_on?: InputMaybe<Array<Debug_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Debug_Order_By>>;
  where?: InputMaybe<Debug_Bool_Exp>;
};

export type Subscription_RootDebug_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Debug_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Debug_Order_By>>;
  where?: InputMaybe<Debug_Bool_Exp>;
};

export type Subscription_RootDebug_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

export type Subscription_RootDebug_StreamArgs = {
  batch_size: Scalars["Int"]["input"];
  cursor: Array<InputMaybe<Debug_Stream_Cursor_Input>>;
  where?: InputMaybe<Debug_Bool_Exp>;
};

export type Subscription_RootNotification_MessagesArgs = {
  distinct_on?: InputMaybe<Array<Notification_Messages_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Notification_Messages_Order_By>>;
  where?: InputMaybe<Notification_Messages_Bool_Exp>;
};

export type Subscription_RootNotification_Messages_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Notification_Messages_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Notification_Messages_Order_By>>;
  where?: InputMaybe<Notification_Messages_Bool_Exp>;
};

export type Subscription_RootNotification_Messages_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

export type Subscription_RootNotification_Messages_StreamArgs = {
  batch_size: Scalars["Int"]["input"];
  cursor: Array<InputMaybe<Notification_Messages_Stream_Cursor_Input>>;
  where?: InputMaybe<Notification_Messages_Bool_Exp>;
};

export type Subscription_RootNotification_PermissionsArgs = {
  distinct_on?: InputMaybe<Array<Notification_Permissions_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Notification_Permissions_Order_By>>;
  where?: InputMaybe<Notification_Permissions_Bool_Exp>;
};

export type Subscription_RootNotification_Permissions_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Notification_Permissions_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Notification_Permissions_Order_By>>;
  where?: InputMaybe<Notification_Permissions_Bool_Exp>;
};

export type Subscription_RootNotification_Permissions_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

export type Subscription_RootNotification_Permissions_StreamArgs = {
  batch_size: Scalars["Int"]["input"];
  cursor: Array<InputMaybe<Notification_Permissions_Stream_Cursor_Input>>;
  where?: InputMaybe<Notification_Permissions_Bool_Exp>;
};

export type Subscription_RootNotificationsArgs = {
  distinct_on?: InputMaybe<Array<Notifications_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Notifications_Order_By>>;
  where?: InputMaybe<Notifications_Bool_Exp>;
};

export type Subscription_RootNotifications_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Notifications_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Notifications_Order_By>>;
  where?: InputMaybe<Notifications_Bool_Exp>;
};

export type Subscription_RootNotifications_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

export type Subscription_RootNotifications_StreamArgs = {
  batch_size: Scalars["Int"]["input"];
  cursor: Array<InputMaybe<Notifications_Stream_Cursor_Input>>;
  where?: InputMaybe<Notifications_Bool_Exp>;
};

export type Subscription_RootUsersArgs = {
  distinct_on?: InputMaybe<Array<Users_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Users_Order_By>>;
  where?: InputMaybe<Users_Bool_Exp>;
};

export type Subscription_RootUsers_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Users_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Users_Order_By>>;
  where?: InputMaybe<Users_Bool_Exp>;
};

export type Subscription_RootUsers_By_PkArgs = {
  id: Scalars["uuid"]["input"];
};

export type Subscription_RootUsers_StreamArgs = {
  batch_size: Scalars["Int"]["input"];
  cursor: Array<InputMaybe<Users_Stream_Cursor_Input>>;
  where?: InputMaybe<Users_Bool_Exp>;
};

/** Boolean expression to compare columns of type "timestamptz". All fields are combined with logical 'AND'. */
export type Timestamptz_Comparison_Exp = {
  _eq?: InputMaybe<Scalars["timestamptz"]["input"]>;
  _gt?: InputMaybe<Scalars["timestamptz"]["input"]>;
  _gte?: InputMaybe<Scalars["timestamptz"]["input"]>;
  _in?: InputMaybe<Array<Scalars["timestamptz"]["input"]>>;
  _is_null?: InputMaybe<Scalars["Boolean"]["input"]>;
  _lt?: InputMaybe<Scalars["timestamptz"]["input"]>;
  _lte?: InputMaybe<Scalars["timestamptz"]["input"]>;
  _neq?: InputMaybe<Scalars["timestamptz"]["input"]>;
  _nin?: InputMaybe<Array<Scalars["timestamptz"]["input"]>>;
};

/** columns and relationships of "users" */
export type Users = {
  __typename?: "users";
  /** An array relationship */
  accounts: Array<Accounts>;
  /** An aggregate relationship */
  accounts_aggregate: Accounts_Aggregate;
  /** An array relationship */
  ais: Array<Badma_Ais>;
  /** An aggregate relationship */
  ais_aggregate: Badma_Ais_Aggregate;
  created_at: Scalars["timestamptz"]["output"];
  email?: Maybe<Scalars["String"]["output"]>;
  email_verified?: Maybe<Scalars["timestamptz"]["output"]>;
  /** An array relationship */
  errors: Array<Badma_Errors>;
  /** An aggregate relationship */
  errors_aggregate: Badma_Errors_Aggregate;
  /** An array relationship */
  games: Array<Badma_Games>;
  /** An aggregate relationship */
  games_aggregate: Badma_Games_Aggregate;
  hasura_role?: Maybe<Scalars["String"]["output"]>;
  id: Scalars["uuid"]["output"];
  image?: Maybe<Scalars["String"]["output"]>;
  is_admin?: Maybe<Scalars["Boolean"]["output"]>;
  /** An array relationship */
  joins: Array<Badma_Joins>;
  /** An aggregate relationship */
  joins_aggregate: Badma_Joins_Aggregate;
  /** An array relationship */
  moves: Array<Badma_Moves>;
  /** An aggregate relationship */
  moves_aggregate: Badma_Moves_Aggregate;
  name?: Maybe<Scalars["String"]["output"]>;
  /** An array relationship */
  notification_messages: Array<Notification_Messages>;
  /** An aggregate relationship */
  notification_messages_aggregate: Notification_Messages_Aggregate;
  /** An array relationship */
  notification_permissions: Array<Notification_Permissions>;
  /** An aggregate relationship */
  notification_permissions_aggregate: Notification_Permissions_Aggregate;
  password?: Maybe<Scalars["String"]["output"]>;
  updated_at: Scalars["timestamptz"]["output"];
};

/** columns and relationships of "users" */
export type UsersAccountsArgs = {
  distinct_on?: InputMaybe<Array<Accounts_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Accounts_Order_By>>;
  where?: InputMaybe<Accounts_Bool_Exp>;
};

/** columns and relationships of "users" */
export type UsersAccounts_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Accounts_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Accounts_Order_By>>;
  where?: InputMaybe<Accounts_Bool_Exp>;
};

/** columns and relationships of "users" */
export type UsersAisArgs = {
  distinct_on?: InputMaybe<Array<Badma_Ais_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Ais_Order_By>>;
  where?: InputMaybe<Badma_Ais_Bool_Exp>;
};

/** columns and relationships of "users" */
export type UsersAis_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Badma_Ais_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Ais_Order_By>>;
  where?: InputMaybe<Badma_Ais_Bool_Exp>;
};

/** columns and relationships of "users" */
export type UsersErrorsArgs = {
  distinct_on?: InputMaybe<Array<Badma_Errors_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Errors_Order_By>>;
  where?: InputMaybe<Badma_Errors_Bool_Exp>;
};

/** columns and relationships of "users" */
export type UsersErrors_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Badma_Errors_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Errors_Order_By>>;
  where?: InputMaybe<Badma_Errors_Bool_Exp>;
};

/** columns and relationships of "users" */
export type UsersGamesArgs = {
  distinct_on?: InputMaybe<Array<Badma_Games_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Games_Order_By>>;
  where?: InputMaybe<Badma_Games_Bool_Exp>;
};

/** columns and relationships of "users" */
export type UsersGames_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Badma_Games_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Games_Order_By>>;
  where?: InputMaybe<Badma_Games_Bool_Exp>;
};

/** columns and relationships of "users" */
export type UsersJoinsArgs = {
  distinct_on?: InputMaybe<Array<Badma_Joins_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Joins_Order_By>>;
  where?: InputMaybe<Badma_Joins_Bool_Exp>;
};

/** columns and relationships of "users" */
export type UsersJoins_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Badma_Joins_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Joins_Order_By>>;
  where?: InputMaybe<Badma_Joins_Bool_Exp>;
};

/** columns and relationships of "users" */
export type UsersMovesArgs = {
  distinct_on?: InputMaybe<Array<Badma_Moves_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Moves_Order_By>>;
  where?: InputMaybe<Badma_Moves_Bool_Exp>;
};

/** columns and relationships of "users" */
export type UsersMoves_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Badma_Moves_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Badma_Moves_Order_By>>;
  where?: InputMaybe<Badma_Moves_Bool_Exp>;
};

/** columns and relationships of "users" */
export type UsersNotification_MessagesArgs = {
  distinct_on?: InputMaybe<Array<Notification_Messages_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Notification_Messages_Order_By>>;
  where?: InputMaybe<Notification_Messages_Bool_Exp>;
};

/** columns and relationships of "users" */
export type UsersNotification_Messages_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Notification_Messages_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Notification_Messages_Order_By>>;
  where?: InputMaybe<Notification_Messages_Bool_Exp>;
};

/** columns and relationships of "users" */
export type UsersNotification_PermissionsArgs = {
  distinct_on?: InputMaybe<Array<Notification_Permissions_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Notification_Permissions_Order_By>>;
  where?: InputMaybe<Notification_Permissions_Bool_Exp>;
};

/** columns and relationships of "users" */
export type UsersNotification_Permissions_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Notification_Permissions_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  order_by?: InputMaybe<Array<Notification_Permissions_Order_By>>;
  where?: InputMaybe<Notification_Permissions_Bool_Exp>;
};

/** aggregated selection of "users" */
export type Users_Aggregate = {
  __typename?: "users_aggregate";
  aggregate?: Maybe<Users_Aggregate_Fields>;
  nodes: Array<Users>;
};

/** aggregate fields of "users" */
export type Users_Aggregate_Fields = {
  __typename?: "users_aggregate_fields";
  count: Scalars["Int"]["output"];
  max?: Maybe<Users_Max_Fields>;
  min?: Maybe<Users_Min_Fields>;
};

/** aggregate fields of "users" */
export type Users_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Users_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]["input"]>;
};

/** Boolean expression to filter rows from the table "users". All fields are combined with a logical 'AND'. */
export type Users_Bool_Exp = {
  _and?: InputMaybe<Array<Users_Bool_Exp>>;
  _not?: InputMaybe<Users_Bool_Exp>;
  _or?: InputMaybe<Array<Users_Bool_Exp>>;
  accounts?: InputMaybe<Accounts_Bool_Exp>;
  accounts_aggregate?: InputMaybe<Accounts_Aggregate_Bool_Exp>;
  ais?: InputMaybe<Badma_Ais_Bool_Exp>;
  ais_aggregate?: InputMaybe<Badma_Ais_Aggregate_Bool_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  email?: InputMaybe<String_Comparison_Exp>;
  email_verified?: InputMaybe<Timestamptz_Comparison_Exp>;
  errors?: InputMaybe<Badma_Errors_Bool_Exp>;
  errors_aggregate?: InputMaybe<Badma_Errors_Aggregate_Bool_Exp>;
  games?: InputMaybe<Badma_Games_Bool_Exp>;
  games_aggregate?: InputMaybe<Badma_Games_Aggregate_Bool_Exp>;
  hasura_role?: InputMaybe<String_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  image?: InputMaybe<String_Comparison_Exp>;
  is_admin?: InputMaybe<Boolean_Comparison_Exp>;
  joins?: InputMaybe<Badma_Joins_Bool_Exp>;
  joins_aggregate?: InputMaybe<Badma_Joins_Aggregate_Bool_Exp>;
  moves?: InputMaybe<Badma_Moves_Bool_Exp>;
  moves_aggregate?: InputMaybe<Badma_Moves_Aggregate_Bool_Exp>;
  name?: InputMaybe<String_Comparison_Exp>;
  notification_messages?: InputMaybe<Notification_Messages_Bool_Exp>;
  notification_messages_aggregate?: InputMaybe<Notification_Messages_Aggregate_Bool_Exp>;
  notification_permissions?: InputMaybe<Notification_Permissions_Bool_Exp>;
  notification_permissions_aggregate?: InputMaybe<Notification_Permissions_Aggregate_Bool_Exp>;
  password?: InputMaybe<String_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "users" */
export enum Users_Constraint {
  /** unique or primary key constraint on columns "email" */
  UsersEmailKey = "users_email_key",
  /** unique or primary key constraint on columns "id" */
  UsersPkey = "users_pkey",
}

/** input type for inserting data into table "users" */
export type Users_Insert_Input = {
  accounts?: InputMaybe<Accounts_Arr_Rel_Insert_Input>;
  ais?: InputMaybe<Badma_Ais_Arr_Rel_Insert_Input>;
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  email?: InputMaybe<Scalars["String"]["input"]>;
  email_verified?: InputMaybe<Scalars["timestamptz"]["input"]>;
  errors?: InputMaybe<Badma_Errors_Arr_Rel_Insert_Input>;
  games?: InputMaybe<Badma_Games_Arr_Rel_Insert_Input>;
  hasura_role?: InputMaybe<Scalars["String"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  image?: InputMaybe<Scalars["String"]["input"]>;
  is_admin?: InputMaybe<Scalars["Boolean"]["input"]>;
  joins?: InputMaybe<Badma_Joins_Arr_Rel_Insert_Input>;
  moves?: InputMaybe<Badma_Moves_Arr_Rel_Insert_Input>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  notification_messages?: InputMaybe<Notification_Messages_Arr_Rel_Insert_Input>;
  notification_permissions?: InputMaybe<Notification_Permissions_Arr_Rel_Insert_Input>;
  password?: InputMaybe<Scalars["String"]["input"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
};

/** aggregate max on columns */
export type Users_Max_Fields = {
  __typename?: "users_max_fields";
  created_at?: Maybe<Scalars["timestamptz"]["output"]>;
  email?: Maybe<Scalars["String"]["output"]>;
  email_verified?: Maybe<Scalars["timestamptz"]["output"]>;
  hasura_role?: Maybe<Scalars["String"]["output"]>;
  id?: Maybe<Scalars["uuid"]["output"]>;
  image?: Maybe<Scalars["String"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  password?: Maybe<Scalars["String"]["output"]>;
  updated_at?: Maybe<Scalars["timestamptz"]["output"]>;
};

/** aggregate min on columns */
export type Users_Min_Fields = {
  __typename?: "users_min_fields";
  created_at?: Maybe<Scalars["timestamptz"]["output"]>;
  email?: Maybe<Scalars["String"]["output"]>;
  email_verified?: Maybe<Scalars["timestamptz"]["output"]>;
  hasura_role?: Maybe<Scalars["String"]["output"]>;
  id?: Maybe<Scalars["uuid"]["output"]>;
  image?: Maybe<Scalars["String"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  password?: Maybe<Scalars["String"]["output"]>;
  updated_at?: Maybe<Scalars["timestamptz"]["output"]>;
};

/** response of any mutation on the table "users" */
export type Users_Mutation_Response = {
  __typename?: "users_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"]["output"];
  /** data from the rows affected by the mutation */
  returning: Array<Users>;
};

/** input type for inserting object relation for remote table "users" */
export type Users_Obj_Rel_Insert_Input = {
  data: Users_Insert_Input;
  /** upsert condition */
  on_conflict?: InputMaybe<Users_On_Conflict>;
};

/** on_conflict condition type for table "users" */
export type Users_On_Conflict = {
  constraint: Users_Constraint;
  update_columns?: Array<Users_Update_Column>;
  where?: InputMaybe<Users_Bool_Exp>;
};

/** Ordering options when selecting data from "users". */
export type Users_Order_By = {
  accounts_aggregate?: InputMaybe<Accounts_Aggregate_Order_By>;
  ais_aggregate?: InputMaybe<Badma_Ais_Aggregate_Order_By>;
  created_at?: InputMaybe<Order_By>;
  email?: InputMaybe<Order_By>;
  email_verified?: InputMaybe<Order_By>;
  errors_aggregate?: InputMaybe<Badma_Errors_Aggregate_Order_By>;
  games_aggregate?: InputMaybe<Badma_Games_Aggregate_Order_By>;
  hasura_role?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  image?: InputMaybe<Order_By>;
  is_admin?: InputMaybe<Order_By>;
  joins_aggregate?: InputMaybe<Badma_Joins_Aggregate_Order_By>;
  moves_aggregate?: InputMaybe<Badma_Moves_Aggregate_Order_By>;
  name?: InputMaybe<Order_By>;
  notification_messages_aggregate?: InputMaybe<Notification_Messages_Aggregate_Order_By>;
  notification_permissions_aggregate?: InputMaybe<Notification_Permissions_Aggregate_Order_By>;
  password?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** primary key columns input for table: users */
export type Users_Pk_Columns_Input = {
  id: Scalars["uuid"]["input"];
};

/** select columns of table "users" */
export enum Users_Select_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Email = "email",
  /** column name */
  EmailVerified = "email_verified",
  /** column name */
  HasuraRole = "hasura_role",
  /** column name */
  Id = "id",
  /** column name */
  Image = "image",
  /** column name */
  IsAdmin = "is_admin",
  /** column name */
  Name = "name",
  /** column name */
  Password = "password",
  /** column name */
  UpdatedAt = "updated_at",
}

/** input type for updating data in table "users" */
export type Users_Set_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  email?: InputMaybe<Scalars["String"]["input"]>;
  email_verified?: InputMaybe<Scalars["timestamptz"]["input"]>;
  hasura_role?: InputMaybe<Scalars["String"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  image?: InputMaybe<Scalars["String"]["input"]>;
  is_admin?: InputMaybe<Scalars["Boolean"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  password?: InputMaybe<Scalars["String"]["input"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
};

/** Streaming cursor of the table "users" */
export type Users_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Users_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Users_Stream_Cursor_Value_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
  email?: InputMaybe<Scalars["String"]["input"]>;
  email_verified?: InputMaybe<Scalars["timestamptz"]["input"]>;
  hasura_role?: InputMaybe<Scalars["String"]["input"]>;
  id?: InputMaybe<Scalars["uuid"]["input"]>;
  image?: InputMaybe<Scalars["String"]["input"]>;
  is_admin?: InputMaybe<Scalars["Boolean"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  password?: InputMaybe<Scalars["String"]["input"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]["input"]>;
};

/** update columns of table "users" */
export enum Users_Update_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Email = "email",
  /** column name */
  EmailVerified = "email_verified",
  /** column name */
  HasuraRole = "hasura_role",
  /** column name */
  Id = "id",
  /** column name */
  Image = "image",
  /** column name */
  IsAdmin = "is_admin",
  /** column name */
  Name = "name",
  /** column name */
  Password = "password",
  /** column name */
  UpdatedAt = "updated_at",
}

export type Users_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Users_Set_Input>;
  /** filter the rows which have to be updated */
  where: Users_Bool_Exp;
};

/** Boolean expression to compare columns of type "uuid". All fields are combined with logical 'AND'. */
export type Uuid_Comparison_Exp = {
  _eq?: InputMaybe<Scalars["uuid"]["input"]>;
  _gt?: InputMaybe<Scalars["uuid"]["input"]>;
  _gte?: InputMaybe<Scalars["uuid"]["input"]>;
  _in?: InputMaybe<Array<Scalars["uuid"]["input"]>>;
  _is_null?: InputMaybe<Scalars["Boolean"]["input"]>;
  _lt?: InputMaybe<Scalars["uuid"]["input"]>;
  _lte?: InputMaybe<Scalars["uuid"]["input"]>;
  _neq?: InputMaybe<Scalars["uuid"]["input"]>;
  _nin?: InputMaybe<Array<Scalars["uuid"]["input"]>>;
};
