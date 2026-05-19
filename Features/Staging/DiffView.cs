using Spectre.Console;
using Spectre.Console.Rendering;
using GitVibe.Styles;

namespace GitVibe.Features.Staging;

public class DiffView(string filename, string diffContent, int scrollOffset = 0) : Renderable
{
    protected override IEnumerable<Segment> Render(RenderOptions options, int maxWidth)
    {
        var rows = new List<IRenderable>();
        
        var lines = diffContent.Replace("\r\n", "\n").Split('\n');
        
        // Simple scrolling: Skip lines based on offset
        // In a real TUI we'd want to know the available height, 
        // but for this MVP we'll just skip and let the layout handle clipping if it doesn't fit.
        var displayLines = lines.Skip(scrollOffset);

        foreach (var line in displayLines)
        {
            if (line.StartsWith('+') && !line.StartsWith("+++"))
            {
                rows.Add(new Markup($"[green]+ {Markup.Escape(line[1..])}[/]"));
            }
            else if (line.StartsWith('-') && !line.StartsWith("---"))
            {
                rows.Add(new Markup($"[red]- {Markup.Escape(line[1..])}[/]"));
            }
            else if (line.StartsWith("@@"))
            {
                rows.Add(new Markup($"[cyan]{Markup.Escape(line)}[/]"));
            }
            else if (line.StartsWith("diff --git") || line.StartsWith("index") || line.StartsWith("---") || line.StartsWith("+++"))
            {
                rows.Add(new Markup($"[grey]{Markup.Escape(line)}[/]"));
            }
            else
            {
                rows.Add(new Text(line));
            }
        }

        var content = rows.Count > 0 ? (IRenderable)new Rows(rows) : new Text("No changes to display.");
        
        var panel = new Panel(content)
            .Header($" [bold yellow]Diff:[/] [white]{Markup.Escape(filename)}[/] ")
            .Border(BoxBorder.Double)
            .BorderStyle(new Style(Color.Yellow))
            .Expand();

        return ((IRenderable)panel).Render(options, maxWidth);
    }
}
