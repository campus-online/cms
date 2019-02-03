import { Map, List, fromJS } from 'immutable';
import { isEqual } from 'lodash';
import {
  DRAFT_CREATE_FROM_ENTRY,
  DRAFT_CREATE_EMPTY,
  DRAFT_DISCARD,
  DRAFT_CHANGE_FIELD,
  DRAFT_VALIDATION_ERRORS,
  ENTRY_PERSIST_REQUEST,
  ENTRY_PERSIST_SUCCESS,
  ENTRY_PERSIST_FAILURE,
  ENTRY_DELETE_SUCCESS,
} from 'Actions/entries';
import {
  UNPUBLISHED_ENTRY_PERSIST_REQUEST,
  UNPUBLISHED_ENTRY_PERSIST_SUCCESS,
  UNPUBLISHED_ENTRY_PERSIST_FAILURE,
} from 'Actions/editorialWorkflow';
import { ADD_ASSET, REMOVE_ASSET } from 'Actions/media';

const initialState = Map({
  entry: Map(),
  mediaFiles: List(),
  fieldsMetaData: Map(),
  fieldsErrors: Map(),
  hasChanged: false,
});

const toJS = object => {
  if (object && typeof object.toJS === 'function') return object.toJS();
  return object;
};

const eq = (a, b) => a === b || isEqual(toJS(a), toJS(b));

const entryDraftReducer = (state = Map(), action) => {
  switch (action.type) {
    case DRAFT_CREATE_FROM_ENTRY:
      // Existing Entry
      return state.withMutations(state => {
        state.set('entry', action.payload.entry);
        state.setIn(['entry', 'newRecord'], false);
        state.set('mediaFiles', List());
        // An existing entry may already have metadata. If we surfed away and back to its
        // editor page, the metadata will have been fetched already, so we shouldn't
        // clear it as to not break relation lists.
        state.set('fieldsMetaData', action.payload.metadata || Map());
        state.set('fieldsErrors', Map());
        state.set('hasChanged', false);
      });
    case DRAFT_CREATE_EMPTY:
      // New Entry
      return state.withMutations(state => {
        state.set('entry', fromJS(action.payload));
        state.setIn(['entry', 'newRecord'], true);
        state.set('mediaFiles', List());
        state.set('fieldsMetaData', Map());
        state.set('fieldsErrors', Map());
        state.set('hasChanged', false);
      });
    case DRAFT_DISCARD:
      return initialState;
    case DRAFT_CHANGE_FIELD: {
      const { value, field, metadata = {} } = action.payload;
      const fieldPath = ['entry', 'data', field];

      // If unchanged, prevent hasChanged false-positves.
      if (!state.getIn('hasChanged', false)) {
        const sameValue = eq(value, state.getIn(fieldPath));
        const sameMetadata = eq(metadata, state.getIn(['fieldsMetaData']));
        if (sameValue && sameMetadata) return state;
      }

      return state.withMutations(state => {
        state.setIn(fieldPath, value);
        state.mergeDeepIn(['fieldsMetaData'], fromJS(metadata));
        state.set('hasChanged', true);
      });
    }
    case DRAFT_VALIDATION_ERRORS:
      if (action.payload.errors.length === 0) {
        return state.deleteIn(['fieldsErrors', action.payload.field]);
      } else {
        return state.setIn(['fieldsErrors', action.payload.field], action.payload.errors);
      }

    case ENTRY_PERSIST_REQUEST:
    case UNPUBLISHED_ENTRY_PERSIST_REQUEST: {
      return state.setIn(['entry', 'isPersisting'], true);
    }

    case ENTRY_PERSIST_FAILURE:
    case UNPUBLISHED_ENTRY_PERSIST_FAILURE: {
      return state.deleteIn(['entry', 'isPersisting']);
    }

    case ENTRY_PERSIST_SUCCESS:
    case UNPUBLISHED_ENTRY_PERSIST_SUCCESS:
      return state.withMutations(state => {
        state.deleteIn(['entry', 'isPersisting']);
        state.set('hasChanged', false);
        if (!state.getIn(['entry', 'slug'])) {
          state.setIn(['entry', 'slug'], action.payload.slug);
        }
      });

    case ENTRY_DELETE_SUCCESS:
      return state.withMutations(state => {
        state.deleteIn(['entry', 'isPersisting']);
        state.set('hasChanged', false);
      });

    case ADD_ASSET:
      if (state.has('mediaFiles')) {
        return state.update('mediaFiles', list => list.push(action.payload.public_path));
      }
      return state;

    case REMOVE_ASSET:
      return state.update('mediaFiles', list => list.filterNot(path => path === action.payload));

    default:
      return state;
  }
};

export default entryDraftReducer;
