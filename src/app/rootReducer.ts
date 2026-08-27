import { combineReducers } from "@reduxjs/toolkit";
import typingReducer from "@/features/typing/state/typingSlice";
import themeReducer from "@/features/theme/state/themeSlice";

const rootReducer = combineReducers({
  typing: typingReducer,
  theme: themeReducer,
});

export default rootReducer;
