//Function that checks if there are any changes made to the profile form fields. If no changes are detected, it shows an info toast message and prevents the form submission.
export const hasNoProfileChanges = (
  currentUsername: string,
  username: string,
  currentEmail: string,
  email: string,
  currentPassword: string,
  selectedFile: File | null
) => {
  const isUsernameUnhanged = username === currentUsername
  const isEmailUnchanged = currentEmail === email
  const isPasswordEmpty = currentPassword === ""
  const isAvatarUnchanged = selectedFile === null
  if (
    isUsernameUnhanged &&
    isEmailUnchanged &&
    isPasswordEmpty &&
    isAvatarUnchanged
  ) {
    return {
      hasChanges: false,
      shouldStop: true,
      message: "No changes made to the profile!"
    }
  }
  return { hasChanges: true, shouldStop: false }
}
