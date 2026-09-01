import { combineReducers } from "@reduxjs/toolkit";
import typingReducer from "@/features/typing/state/typingSlice";
import themeReducer from "@/features/theme/state/themeSlice";
import typingConfigReducer from "@/features/typingConfig/state/typingConfigSlice";
import authReducer from "@/features/auth/state/authSlice";
import historyReducer from "@/features/history/state/historySlice";
import wordDropReducer from "@/features/games/state/gamesSlice";

const rootReducer = combineReducers({
  typing: typingReducer,
  theme: themeReducer,
  typingConfig: typingConfigReducer,
  auth: authReducer,
  history: historyReducer,
  wordDrop: wordDropReducer,
});

export default rootReducer;
