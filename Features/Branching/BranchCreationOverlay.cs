using Spectre.Console;
using Spectre.Console.Rendering;

namespace GitVibe.Features.Branching;

public class BranchCreationOverlay : IRenderable
{
    private readonly string _branchName;
    private Panel? _cachedPanel;

    public BranchCreationOverlay(string branchName)
    {
        _branchName = branchName;
    }

    public Measurement Measure(RenderOptions options, int maxWidth)
    {
        _cachedPanel ??= CreatePanel();
        return ((IRenderable)_cachedPanel).Measure(options, maxWidth);
    }

    public IEnumerable<Segment> Render(RenderOptions options, int maxWidth)
    {
        _cachedPanel ??= CreatePanel();
        return ((IRenderable)_cachedPanel).Render(options, maxWidth);
    }

    private Panel CreatePanel()
    {
        var content = new Rows(
            new Text("Enter new branch name:", new Style(Color.Magenta, decoration: Decoration.Bold)),
            new Text(""),
            new Panel(new Text(string.IsNullOrEmpty(_branchName) ? " " : _branchName))
                .Border(BoxBorder.None)
                .Padding(1, 0, 1, 0),
            new Text(""),
            new Markup("[grey][[Enter]][/] Create  [grey][[Esc]][/] Cancel")
        );

        return new Panel(content)
            .Header(" [bold magenta]New Branch[/] ")
            .Border(BoxBorder.Double)
            .BorderStyle(new Style(Color.Magenta))
            .Padding(1, 1, 1, 1);
    }
}
