import { combineReducers } from "@reduxjs/toolkit";
import typingReducer from "@/features/typing/state/typingSlice";
import themeReducer from "@/features/theme/state/themeSlice";
import typingConfigReducer from "@/features/typingConfig/state/typingConfigSlice";

const rootReducer = combineReducers({
  typing: typingReducer,
  theme: themeReducer,
  typingConfig: typingConfigReducer,
});

export default rootReducer;
