import Link from 'next/link';

export default function HomePage() {
  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-8"
      style={{ backgroundColor: '#191B1C' }}
    >
      <div className="max-w-2xl text-center">
        {/* Header */}
        <h1 className="text-6xl font-bold text-white mb-6">
          Corruchart
        </h1>
        
        {/* Information Paragraph */}
        <p className="text-lg text-gray-300 mb-8 leading-relaxed">
          Welcome to the Chart Information Portal. This interactive tool allows you to 
          visualize and analyze data through customizable charts. You&apos;ll be able to 
          input your data points, choose from various chart types (bar, line, pie, etc.), 
          and customize the appearance to match your needs. The chart you&apos;ll be filling 
          out will help organize and present your data in a clear, visually appealing format.
        </p>
        
        {/* Begin Button/Link */}
        <Link 
          href="/corruchart"
          className="inline-flex items-center justify-center px-8 py-3 text-lg font-semibold text-white bg-violet-800 hover:bg-violet-800 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          Begin
        </Link>
      </div>
    </div>
  );
}