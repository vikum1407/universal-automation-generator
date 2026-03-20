import { getUniversalModel } from "./getUniversalModel";

export async function modelHandler(context: any) {
  try {
    const snapshot = context.snapshot;
    const learning = context.learning;

    const response = getUniversalModel(snapshot, learning);

    return {
      status: 200,
      body: response,
    };
  } catch (err) {
    return {
      status: 500,
      body: { error: "Failed to build universal model" },
    };
  }
}
