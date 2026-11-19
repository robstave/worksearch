export function ResumesPage() {
  return (
    <section aria-labelledby="resumes-heading">
      <h2 id="resumes-heading" className="text-2xl font-bold text-white mb-2">Resumes</h2>
      <p className="text-gray-400 mb-6">Keep your latest resume handy for your next application.</p>
      <div className="max-w-2xl rounded-lg border border-gray-700 bg-gray-800 p-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-semibold text-white">Latest resume</h3>
          <span className="rounded-full bg-gray-700 px-3 py-1 text-xs text-gray-300">Coming soon</span>
        </div>
        <div className="rounded-md border border-dashed border-gray-600 p-8 text-center">
          <p className="font-medium text-gray-200">No resume added yet</p>
          <p className="mt-2 text-sm text-gray-400">This space will hold your latest resume. Uploading and viewing will be added in a future update.</p>
        </div>
      </div>
    </section>
  );
}
